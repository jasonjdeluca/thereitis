#!/usr/bin/env node
// process-review-queue.js — Phase 2 enrichment queue tool (NO API — subscription model).
//
// The deterministic Docker pipeline (fetcher → extractor → validator) writes a
// pending work item to data/review-queue/{TICKER}.json for each company. The
// JUDGMENT step (selecting the best CEO-idiom phrases and writing trivia) is NOT
// done by an API call. It is done by a Claude Code agent working on this project,
// using the Claude subscription — see docs/program/ENRICHMENT_QUEUE.md.
//
// This script has NO Anthropic API dependency. It only:
//   --list                 show what is pending and what each item still needs
//   --finalize <TICKER>    validate the agent-written generated/ output for a
//                          company, emit migration.sql, mark the job ready, and
//                          move the queue item to data/review-queue/processed/.
//
// Agent workflow per pending company:
//   1. node scripts/ingestion/process-review-queue.js --list
//   2. Read data/review-queue/{TICKER}.json (prepared-remarks paragraphs).
//   3. Select 40–50 recurring CEO-idiom phrases + write 12–18 trivia questions
//      per docs/program/ENRICHMENT_QUEUE.md.
//   4. Write company-packs/{TICKER}/generated/phrases.json and trivia.json.
//   5. node scripts/ingestion/process-review-queue.js --finalize {TICKER}

import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync, existsSync } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { DATA_DIR, DB_PATH, REPO_ROOT, log, logError } from './lib/common.js';

const PACKS_DIR = path.join(REPO_ROOT, 'company-packs');
const REVIEW_QUEUE_DIR = path.join(DATA_DIR, 'review-queue');
const PROCESSED_DIR = path.join(REVIEW_QUEUE_DIR, 'processed');
const MAX_PHRASE_CHARS = 25;
const MIN_APPROVED_PHRASES = 12;

// ─── Stage 5: deterministic validation (unchanged rules) ──────────────────────

function validateOutput(output) {
  const issues = [];
  const approved = [];
  const seen = new Set();

  for (const phrase of output.phrases ?? []) {
    if (typeof phrase !== 'string') { issues.push('non-string phrase skipped'); continue; }
    const p = phrase.trim();
    if (!p) { issues.push('blank phrase rejected'); continue; }
    if (p.length > MAX_PHRASE_CHARS) { issues.push(`too long (${p.length} chars): "${p}"`); continue; }
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(p)) { issues.push(`possible person name rejected: "${p}"`); continue; }
    const key = p.toLowerCase();
    if (seen.has(key)) { issues.push(`duplicate phrase skipped: "${p}"`); continue; }
    seen.add(key);
    approved.push(p);
  }

  const triviaApproved = [];
  for (const q of output.trivia ?? []) {
    const required = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
    const missing = required.filter(k => !q[k]);
    if (missing.length) { issues.push(`trivia missing fields: ${missing.join(', ')}`); continue; }
    if (!['a', 'b', 'c', 'd'].includes(q.correct_answer)) {
      issues.push(`invalid correct_answer "${q.correct_answer}"`); continue;
    }
    const allText = [q.question, q.option_a, q.option_b, q.option_c, q.option_d].join(' ');
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(allText)) {
      issues.push(`trivia rejected (possible person name / two-capitalized-words): "${q.question}"`); continue;
    }
    if ([q.option_a, q.option_b, q.option_c, q.option_d].some(o => String(o).length > 80)) {
      issues.push(`trivia option over 80 chars: "${q.question}"`); continue;
    }
    triviaApproved.push(q);
  }

  return { approved, triviaApproved, issues };
}

function buildSql(companyId, ticker, approved, triviaApproved) {
  const esc = s => String(s).replace(/'/g, "''");
  const phraseRows = approved
    .map(p => `  ('${companyId}', '${esc(p)}', 'standard', 1, true, false)`)
    .join(',\n');
  const triviaRows = triviaApproved
    .map(q => `  ('${companyId}', '${esc(q.question)}', '${esc(q.option_a)}', '${esc(q.option_b)}', '${esc(q.option_c)}', '${esc(q.option_d)}', '${q.correct_answer}', 'earnings', 'medium', true)`)
    .join(',\n');

  return `-- ${ticker} phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize ${ticker}
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- ${new Date().toISOString()}
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
${phraseRows}
ON CONFLICT (company_id, phrase) DO NOTHING;
${triviaRows ? `
INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
${triviaRows}
ON CONFLICT DO NOTHING;
` : '-- (no trivia passed validation)\n'}
UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = '${companyId}')
  WHERE id = '${companyId}';
`;
}

// ─── Modes ────────────────────────────────────────────────────────────────────

function readQueueItem(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { return { _error: e.message }; }
}

function itemSize(batch) {
  if (Array.isArray(batch.quarter_entries)) return `${batch.quarter_entries.length} quarters of prepared remarks`;
  if (Array.isArray(batch.candidates)) return `${batch.candidates.length} candidates`;
  return 'unknown input';
}

function listQueue() {
  if (!existsSync(REVIEW_QUEUE_DIR)) { log('No review-queue/ directory — nothing pending.'); return; }
  const files = readdirSync(REVIEW_QUEUE_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) { log('Enrichment queue is empty — nothing to process.'); return; }

  log(`Enrichment queue — ${files.length} pending compan${files.length === 1 ? 'y' : 'ies'}:`);
  log('(process each per docs/program/ENRICHMENT_QUEUE.md using your Claude subscription — no API)\n');
  for (const f of files.sort()) {
    const ticker = path.basename(f, '.json');
    const batch = readQueueItem(path.join(REVIEW_QUEUE_DIR, f));
    if (batch._error) { log(`  ${ticker.padEnd(6)} ⚠️  unreadable (${batch._error})`); continue; }
    const genDir = path.join(PACKS_DIR, ticker, 'generated');
    const hasPhrases = existsSync(path.join(genDir, 'phrases.json'));
    const hasTrivia = existsSync(path.join(genDir, 'trivia.json'));
    let state;
    if (hasPhrases && hasTrivia) state = '→ generated/ ready: run --finalize ' + ticker;
    else if (hasPhrases || hasTrivia) state = `→ partial (phrases:${hasPhrases} trivia:${hasTrivia}) — finish then --finalize`;
    else state = '→ NEEDS ENRICHMENT: read queue file, write phrases.json + trivia.json';
    log(`  ${ticker.padEnd(6)} ${itemSize(batch).padEnd(34)} ${state}`);
  }
}

function finalize(ticker) {
  const queuePath = path.join(REVIEW_QUEUE_DIR, `${ticker}.json`);
  if (!existsSync(queuePath)) { logError(`No queue item at ${path.relative(REPO_ROOT, queuePath)} — nothing to finalize for ${ticker}.`); process.exit(1); }
  const batch = readQueueItem(queuePath);
  if (batch._error) { logError(`Cannot read queue item: ${batch._error}`); process.exit(1); }
  const companyId = batch.company_id || ticker.toLowerCase();

  const genDir = path.join(PACKS_DIR, ticker, 'generated');
  const phrasesPath = path.join(genDir, 'phrases.json');
  const triviaPath = path.join(genDir, 'trivia.json');
  if (!existsSync(phrasesPath) || !existsSync(triviaPath)) {
    logError(`Missing agent output. Write both before finalizing:`);
    logError(`  ${path.relative(REPO_ROOT, phrasesPath)}  (JSON array of phrase strings)`);
    logError(`  ${path.relative(REPO_ROOT, triviaPath)}   (JSON array of trivia objects)`);
    logError(`See docs/program/ENRICHMENT_QUEUE.md for the format and selection rubric.`);
    process.exit(1);
  }

  let phrases, trivia;
  try { phrases = JSON.parse(readFileSync(phrasesPath, 'utf8')); }
  catch (e) { logError(`phrases.json parse error: ${e.message}`); process.exit(1); }
  try { trivia = JSON.parse(readFileSync(triviaPath, 'utf8')); }
  catch (e) { logError(`trivia.json parse error: ${e.message}`); process.exit(1); }

  const { approved, triviaApproved, issues } = validateOutput({ phrases, trivia });
  log(`${ticker}: ${approved.length} phrases approved, ${triviaApproved.length} trivia, ${issues.length} issue(s)`);
  for (const i of issues.slice(0, 12)) log(`   - ${i}`);
  if (issues.length > 12) log(`   …and ${issues.length - 12} more`);

  if (approved.length < MIN_APPROVED_PHRASES) {
    logError(`Only ${approved.length} phrases passed validation (need ≥${MIN_APPROVED_PHRASES}). Not finalized — add more phrases and re-run.`);
    process.exit(1);
  }

  writeFileSync(path.join(genDir, 'validation_report.json'), JSON.stringify({
    ticker, company_id: companyId,
    finalized_at: new Date().toISOString(),
    enriched_by: 'claude-code-agent (subscription)',
    mode: batch.mode ?? 'paragraphs',
    phrases_approved: approved.length,
    trivia_approved: triviaApproved.length,
    validation_issues: issues,
    ready_for_migration: approved.length >= 50 && triviaApproved.length >= 12,
  }, null, 2));
  writeFileSync(path.join(genDir, 'migration.sql'), buildSql(companyId, ticker, approved, triviaApproved));

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.prepare(`UPDATE phase2_jobs SET status='ready_for_review', updated_at=datetime('now') WHERE company_id=?`).run(companyId);
  db.close();

  mkdirSync(PROCESSED_DIR, { recursive: true });
  renameSync(queuePath, path.join(PROCESSED_DIR, `${ticker}.json`));

  log(`${ticker}: finalized → company-packs/${ticker}/generated/migration.sql`);
  log(`  ${approved.length} phrases, ${triviaApproved.length} trivia. Queue item moved to processed/. Status: ready_for_review.`);
  if (approved.length < 50 || triviaApproved.length < 12) {
    log(`  NOTE: below the 50-phrase / 12-trivia activation target — usable, but add more before activation if possible.`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const finalizeIdx = args.indexOf('--finalize');
if (finalizeIdx !== -1) {
  const ticker = args[finalizeIdx + 1]?.toUpperCase();
  if (!ticker) { logError('Usage: --finalize <TICKER>'); process.exit(1); }
  finalize(ticker);
} else {
  listQueue();
}
