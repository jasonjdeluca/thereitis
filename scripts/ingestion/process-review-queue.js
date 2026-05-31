#!/usr/bin/env node
// process-review-queue.js — Phase 2 AI enrichment, run inside a Claude Code session.
// Reads pending batches from data/review-queue/, calls Claude Haiku for scoring
// and trivia generation, validates output, writes to company-packs/{TICKER}/generated/.
//
// Usage: node scripts/ingestion/process-review-queue.js [--ticker TICKER]
// Requires: ANTHROPIC_API_KEY in .env (loaded automatically via common.js)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import Database from 'better-sqlite3';
import { DATA_DIR, DB_PATH, REPO_ROOT, log, logError } from './lib/common.js';

const PACKS_DIR = path.join(REPO_ROOT, 'company-packs');
const REVIEW_QUEUE_DIR = path.join(DATA_DIR, 'review-queue');
const MAX_PHRASE_CHARS = 25;
const MIN_APPROVED_PHRASES = 15;

// ─── Stage 4 (paragraph mode): identify CEO idioms from prepared remarks ─────

async function stage4IdentifyPhrases(client, quarterEntries, ticker) {
  const phraseCounts = new Map(); // phrase → Set of quarters

  for (const entry of quarterEntries) {
    const { quarter, paragraphs } = entry;
    if (!paragraphs?.length) continue;

    const text = paragraphs.join('\n\n');
    const prompt = `From these ${ticker} earnings call prepared remarks (${quarter}), identify CEO-speak idioms.

A CEO idiom is a 2-4 word phrase that:
- Sounds like something an executive says to project confidence or frame strategy
- Would cause a knowing groan from a bingo player: "there it is"
- Is NOT a financial metric, geographic segment, product name, or person name

Good examples: "unlocking value", "playing offense", "our flywheel", "double down", "lean into"

TEXT:
${text}

Return ONLY a JSON array of lowercase 2-4 word phrases found in this text. JSON only, no explanation.`;

    let attempt = 0;
    while (true) {
      try {
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });

        const raw = response.content[0].text.trim()
          .replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
        let phrases = [];
        try { phrases = JSON.parse(raw); } catch { phrases = []; }

        for (const phrase of phrases) {
          if (typeof phrase !== 'string') continue;
          const p = phrase.trim().toLowerCase();
          const wordCount = p.split(/\s+/).length;
          if (!p || p.length > 25 || wordCount < 2 || wordCount > 4) continue;
          if (!phraseCounts.has(p)) phraseCounts.set(p, new Set());
          phraseCounts.get(p).add(quarter);
        }
        break;
      } catch (err) {
        if (err.status === 429 && attempt < 3) {
          attempt++;
          const wait = 65 * attempt;
          log(`  rate limited — waiting ${wait}s (attempt ${attempt}/3)`);
          await new Promise(r => setTimeout(r, wait * 1000));
        } else {
          throw err;
        }
      }
    }
  }

  return Array.from(phraseCounts.entries())
    .filter(([, quarters]) => quarters.size >= 2)
    .map(([phrase, quarters]) => ({
      phrase,
      quarter_count: quarters.size,
      quarters: Array.from(quarters).sort(),
    }))
    .sort((a, b) => b.quarter_count - a.quarter_count)
    .slice(0, 200);
}

// ─── Stage 4: AI scoring and trivia ──────────────────────────────────────────

async function stage4Score(client, candidates, ticker) {
  const BATCH = 50;
  const scores = new Map();

  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const numbered = batch
      .map((c, j) => `${i + j}. "${c.phrase}" (${c.quarter_count} quarters)`)
      .join('\n');

    const prompt = `You are scoring phrase candidates for a ${ticker} earnings call BINGO game.

Players mark phrases on their cards when they hear executives say them live. The best bingo phrase causes a knowing groan or laugh — "there it is." Score for SPEAKING STYLE, not subject matter.

Score each phrase 0–10:
- 8-10: Executive idiom, rhetorical framing, or CEO buzzword. Company-specific feel. ("double down", "playing offense", "unlocking value", "our flywheel")
- 5-7: Recurring company language, somewhat distinctive, not pure boilerplate.
- 2-4: Topic label (geographic, product, metric) or generic financial term. Any company could say it.
- 0-1: Boilerplate, legal text, ceremony filler, vendor disclaimer, operator instructions.

CANDIDATES:
${numbered}

Return ONLY a JSON array of {index, score} objects in order. No explanation. Example: [{"index":0,"score":7},{"index":1,"score":2}]`;

    let attempt = 0;
    while (true) {
      try {
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const raw = response.content[0].text.trim()
          .replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
        let ratings;
        try { ratings = JSON.parse(raw); }
        catch { ratings = []; }

        for (const r of ratings) {
          if (typeof r.index === 'number' && r.index < candidates.length) {
            scores.set(candidates[r.index].phrase, r.score ?? 0);
          }
        }
        break;
      } catch (err) {
        if (err.status === 429 && attempt < 3) {
          attempt++;
          const wait = 65 * attempt;
          log(`  rate limited — waiting ${wait}s (attempt ${attempt}/3)`);
          await new Promise(r => setTimeout(r, wait * 1000));
        } else {
          throw err;
        }
      }
    }
  }

  return scores;
}

async function stage4Trivia(client, ticker) {
  const prompt = `Generate 15 trivia questions about ${ticker} as a company — history, strategy, products, financials, milestones. Mix easy, medium, and hard difficulty.

HARD RULES:
- No person names anywhere — not in questions, not in any answer option. Use role titles only (e.g. "the CEO", "the CFO", "the founder").
- Each question must have exactly 4 distinct answer options and one correct answer.
- No answer option over 80 characters.

Return ONLY a JSON array:
[{"question":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"a"},...]
correct_answer must be "a", "b", "c", or "d". JSON only, no markdown.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(raw); }
  catch { return []; }
}

async function stage4Enrich(client, batch, ticker) {
  let candidates;

  if (batch.mode === 'paragraphs') {
    // Layer 2: identify idioms from prepared-remarks paragraphs, then score
    log(`  Stage 4a — identifying phrases from ${batch.quarter_entries.length} quarters of prepared remarks`);
    candidates = await stage4IdentifyPhrases(client, batch.quarter_entries, ticker);
    log(`  Identified ${candidates.length} candidate phrases (≥2 quarters)`);
    if (candidates.length < 10) {
      log(`  Warning: only ${candidates.length} candidates — results may be sparse`);
    }
  } else {
    // Layer 1 (n-gram mode): score pre-extracted candidates
    candidates = batch.candidates ?? [];
    log(`  Stage 4a — scoring ${candidates.length} n-gram candidates`);
  }

  const scores = await stage4Score(client, candidates, ticker);

  const scored = candidates
    .filter(c => scores.has(c.phrase))
    .map(c => ({ ...c, ai_score: scores.get(c.phrase) }))
    .sort((a, b) => b.ai_score - a.ai_score || b.quarter_count - a.quarter_count);

  const selected = scored.slice(0, 50).map(c => c.phrase);
  log(`  Stage 4b — generating trivia`);
  const trivia = await stage4Trivia(client, ticker);

  return { phrases: selected, trivia };
}

// ─── Stage 5: validation and SQL generation ───────────────────────────────────

function stage5Validate(aiOutput) {
  const issues = [];
  const approved = [];

  for (const phrase of aiOutput.phrases ?? []) {
    if (typeof phrase !== 'string') { issues.push('non-string phrase skipped'); continue; }
    const p = phrase.trim();
    if (!p) { issues.push('blank phrase rejected'); continue; }
    if (p.length > MAX_PHRASE_CHARS) { issues.push(`too long (${p.length} chars): "${p}"`); continue; }
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(p)) {
      issues.push(`possible person name rejected: "${p}"`); continue;
    }
    approved.push(p);
  }

  const triviaApproved = [];
  for (const q of aiOutput.trivia ?? []) {
    const required = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
    const missing = required.filter(k => !q[k]);
    if (missing.length) { issues.push(`trivia missing fields: ${missing.join(', ')}`); continue; }
    if (!['a', 'b', 'c', 'd'].includes(q.correct_answer)) {
      issues.push(`invalid correct_answer "${q.correct_answer}"`); continue;
    }
    const allText = [q.question, q.option_a, q.option_b, q.option_c, q.option_d].join(' ');
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(allText)) {
      issues.push('trivia contains possible person name — skipped'); continue;
    }
    triviaApproved.push(q);
  }

  return { approved, triviaApproved, issues };
}

function stage5Sql(companyId, ticker, approved, triviaApproved) {
  const esc = s => s.replace(/'/g, "''");

  const phraseRows = approved
    .map(p => `  ('${companyId}', '${esc(p)}', 'standard', 1, true, false)`)
    .join(',\n');

  const triviaRows = triviaApproved
    .map(q => `  ('${companyId}', '${esc(q.question)}', '${esc(q.option_a)}', '${esc(q.option_b)}', '${esc(q.option_c)}', '${esc(q.option_d)}', '${q.correct_answer}', 'earnings', 'medium', true)`)
    .join(',\n');

  return `-- ${ticker} phrase and trivia migration
-- Generated by scripts/ingestion/process-review-queue.js
-- ${new Date().toISOString()}
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false.
-- Company must be manually activated once phrases are reviewed.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
${phraseRows};

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
${triviaRows};

-- Refresh phrase count (counts inactive phrases so admin can see the total)
UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = '${companyId}')
  WHERE id = '${companyId}';
`;
}

// ─── Batch processing ─────────────────────────────────────────────────────────

async function processBatch(client, db, batchPath) {
  let batch;
  try { batch = JSON.parse(readFileSync(batchPath, 'utf8')); }
  catch (e) { logError(`Cannot parse ${batchPath}: ${e.message}`); return; }

  if (batch.status !== 'pending') {
    log(`Skipping ${path.basename(batchPath)} — status is "${batch.status}"`);
    return;
  }

  const { ticker, company_id } = batch;
  const modeLabel = batch.mode === 'paragraphs'
    ? `${batch.quarter_entries?.length ?? 0} quarters of prepared remarks`
    : `${batch.candidates?.length ?? 0} n-gram candidates`;
  log(`--- ${ticker}: ${modeLabel} (mode: ${batch.mode ?? 'ngrams'}) ---`);

  let aiOutput;
  try {
    aiOutput = await stage4Enrich(client, batch, ticker);
    log(`  AI returned ${aiOutput.phrases?.length ?? 0} phrases, ${aiOutput.trivia?.length ?? 0} trivia`);
  } catch (e) {
    logError(`${ticker}: Stage 4 failed: ${e.message}`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`)
      .run(`Stage 4 failed: ${e.message}`, company_id);
    return;
  }

  log(`  Stage 5 — validating`);
  const { approved, triviaApproved, issues } = stage5Validate(aiOutput);
  log(`  ${approved.length} phrases approved, ${triviaApproved.length} trivia, ${issues.length} issue(s)`);

  if (approved.length < MIN_APPROVED_PHRASES) {
    logError(`${ticker}: only ${approved.length} phrases passed validation (need ≥${MIN_APPROVED_PHRASES})`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`)
      .run(`only ${approved.length} phrases passed (need ≥${MIN_APPROVED_PHRASES})`, company_id);
    return;
  }

  const generatedDir = path.join(PACKS_DIR, ticker, 'generated');
  mkdirSync(generatedDir, { recursive: true });

  writeFileSync(path.join(generatedDir, 'phrases.json'), JSON.stringify(approved, null, 2));
  writeFileSync(path.join(generatedDir, 'trivia.json'), JSON.stringify(triviaApproved, null, 2));
  writeFileSync(path.join(generatedDir, 'validation_report.json'), JSON.stringify({
    ticker, company_id,
    generated_at: new Date().toISOString(),
    mode: batch.mode ?? 'ngrams',
    quarters_processed: batch.mode === 'paragraphs' ? batch.quarter_entries?.length : undefined,
    candidates_raw_count: batch.candidates_raw_count,
    phrases_approved: approved.length,
    trivia_approved: triviaApproved.length,
    validation_issues: issues,
    ready_for_migration: approved.length >= 50,
  }, null, 2));
  writeFileSync(path.join(generatedDir, 'migration.sql'), stage5Sql(company_id, ticker, approved, triviaApproved));

  db.prepare(`UPDATE phase2_jobs SET status='ready_for_review', updated_at=datetime('now') WHERE company_id=?`).run(company_id);

  unlinkSync(batchPath);
  log(`${ticker}: done — ${approved.length} phrases, ${triviaApproved.length} trivia written to company-packs/${ticker}/generated/`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ticker') out.ticker = args[++i]?.toUpperCase();
  }
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY is required — set it in .env');
    process.exit(1);
  }

  const { ticker: tickerFilter } = parseArgs();

  if (!existsSync(REVIEW_QUEUE_DIR)) {
    log('review-queue/ directory does not exist — no batches to process');
    process.exit(0);
  }

  const batchFiles = readdirSync(REVIEW_QUEUE_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !tickerFilter || f.startsWith(tickerFilter))
    .map(f => path.join(REVIEW_QUEUE_DIR, f));

  if (batchFiles.length === 0) {
    log(`No pending batches found in review-queue/${tickerFilter ? ` for ${tickerFilter}` : ''}`);
    process.exit(0);
  }

  log(`Found ${batchFiles.length} pending batch(es)${tickerFilter ? ` for ${tickerFilter}` : ''}`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  for (const batchPath of batchFiles) {
    try {
      await processBatch(client, db, batchPath);
    } catch (e) {
      logError(`Unhandled error processing ${path.basename(batchPath)}: ${e.message}`);
    }
  }

  db.close();
  log('All batches processed.');
}

main().catch(e => { logError('Fatal:', e.message); process.exit(1); });
