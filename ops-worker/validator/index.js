#!/usr/bin/env node
// validator — Phase 2 Stage 3 filter + review queue write.
// Stage 3: structural filter on candidate_phrases.json
// Output: data/review-queue/{ticker}.json — candidates ready for AI review
// in a Claude Code session via scripts/ingestion/process-review-queue.js
// Env: none required (no Anthropic API calls)

import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const PACKS_DIR = process.env.PACKS_DIR || '/app/company-packs';
const DB_PATH = path.join(DATA_DIR, 'ingestion-queue.db');
const TICKER_FILTER = process.env.TICKER?.toUpperCase() || null;
const MAX_PHRASE_CHARS = 25;
const MIN_STAGE3_QUARTERS = 2;
const STAGE3_MAX_CANDIDATES = 200;
const REVIEW_QUEUE_DIR = path.join(DATA_DIR, 'review-queue');

const ts = () => new Date().toISOString();
const log = (...a) => console.log(`[${ts()}]`, ...a);
const logErr = (...a) => console.error(`[${ts()}]`, ...a);

const FILLER_BLOCKLIST = new Set([
  'going forward', 'at this time', 'at this point', 'in terms of',
  'as well as', 'as a result', 'in addition to', 'on behalf of',
  'in order to', 'with respect to', 'with regard to', 'based on',
  'moving forward', 'we believe that', 'we continue to', 'we are pleased',
  'very pleased', 'very excited', 'we remain focused', 'remain focused',
  'on a year', 'year over year', 'basis points', 'earnings per share',
  // Call ceremony phrases (operator/host boilerplate)
  'good afternoon everyone', 'good morning everyone', 'good evening everyone',
  'thank you for joining', 'thank you for joining us', 'thank you operator',
  'for your question', 'for the question', 'questions and answers',
  'our next question', 'your next question', 'next question please',
  'please go ahead', 'you may proceed', 'open the line', 'open for questions',
  'joining the call', 'on the call today', 'on the call with us',
  'conference call', 'earnings conference', 'earnings call today',
  'thanks for joining', 'thanks for taking', 'taking my question',
  'taking our question', 'morning everyone', 'good morning', 'good afternoon',
  'listen only mode', 'listen-only mode', 'disconnect your lines',
  'your line is now', 'first question', 'let me turn', 'my pleasure',
  'following our prepared', 'during the quarter', 'during the call',
  // Legal / forward-looking statement boilerplate
  'differ materially', 'actual results', 'forward looking', 'forward-looking',
  'cautionary statement', 'safe harbor', 'among other things', 'without limitation',
  'filings with the sec', 'sec filings', 'risk factors', 'closing comments',
  'factors identified', 'cautionary note', 'statements regarding',
  'regarding future events', 'change without notice', 'subject to change',
  'express implied', 'believe to be reliable', 'basis of investment',
  'construed as advice', 'constructed as advice', 'available data',
  'associated with the use',
  // Financial formula fragments
  'approximately billion', 'approximately million', 'approximately percent',
  'approximately basis', 'beginning and ending', 'ending long-term',
  'average of beginning', 'trailing twelve months', 'twelve months return',
  'months return on', 'return on invested', 'months return',
  // Additional legal / FactSet terms
  'including without', 'without limitation', 'including any', 'hereunder including',
  'arising under', 'losses arising', 'damages including', 'employees including',
  'solely for information', 'published solely', 'beliefs of factset',
  'call is being recorded', 'accompanying slide', 'taking my question',
  'taking our question', 'following our prepared', 'closing comments',
  'forward to speaking', 'during the call', 'include forward-looking',
  'question during the call', 'joining us today', 'like to turn',
  'let me turn the', 'please limit yourself', 'limit yourself to one',
]);

const STAGE3_REJECT_PATTERNS = [
  // Financial formula fragments
  /\bpercent\b/,
  /\bquarter of\b/,
  /\bquarter our\b/,
  /\brate was\b/,
  /\bfrom last year\b/,
  /\bof last year\b/,
  // Legal boilerplate — FactSet, forward-looking disclaimers
  /hereunder/,
  /arising under/,
  /\bdamages\b/,
  /\bwarranties\b/,
  /\bliabilit/,
  /\bstatutory\b/,
  /\bsolely for\b/,
  /\bpublished solely\b/,
  /\blosses arising\b/,
  /reform act/,
  /\bmeaning of the\b/,
  /\bact of including\b/,
  /\bincluding without\b/,
  /including any reliance/,
  /beliefs of factset/,
  /\bfactset\b/,
  /\bcorrected transcript\b/,
  /\bsolely for information\b/,
  /\bquarterly reports\b/,
  /on form \d/i,
  /\bassumptions regarding\b/,
  /\bcontrol including\b/,
  // Call ceremony / roster
  /analyst\s+\w+/,
  /\bchief (executive|financial|operating)\b/,
  /\b(executive|financial) officer\b/,
  /\binvestor relations\b/,
  /earnings call\b/,
  /\baccompanying slide\b/,
  /\bcall is being recorded\b/,
  /and good morning/,
  /\bjoining us today\b/,
  /\bfollowing our prepared\b/,
  /\bduring the call\b/,
  /\bclosing comments\b/,
  /\bforward to speaking\b/,
  /\binclude forward-looking\b/,
  /\bquestion during\b/,
  // FactSet disclaimer cluster (catches WMT-style contamination)
  /accuracy (completeness|integrity)/,
  /any (implied|indirect|information)/,
  /lost profits/,
  /advice designed/,
  /answer section/,
  /including the writer/,
];

function stage3Filter(candidates) {
  return candidates
    .filter(c => {
      const p = c.phrase;
      if (p.length > MAX_PHRASE_CHARS) return false;
      if (c.quarter_count < MIN_STAGE3_QUARTERS) return false;
      if (FILLER_BLOCKLIST.has(p)) return false;
      if (/^[A-Z\s]{2,6}$/.test(p)) return false;
      if (STAGE3_REJECT_PATTERNS.some(rx => rx.test(p))) return false;
      return true;
    })
    .slice(0, STAGE3_MAX_CANDIDATES);
}

function openDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

async function processCompany(db, job) {
  const { company_id, ticker } = job;
  log(`--- ${ticker} ---`);

  const candidatesPath = path.join(PACKS_DIR, ticker, 'candidate_phrases.json');
  if (!existsSync(candidatesPath)) {
    const msg = 'candidate_phrases.json not found';
    logErr(`${ticker}: ${msg}`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`).run(msg, company_id);
    return;
  }

  let rawCandidates;
  try { rawCandidates = JSON.parse(readFileSync(candidatesPath, 'utf8')); }
  catch (e) {
    const msg = `candidates parse error: ${e.message}`;
    logErr(`${ticker}: ${msg}`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`).run(msg, company_id);
    return;
  }

  log(`${ticker}: Stage 3 — filtering ${rawCandidates.length} candidates`);
  const filtered = stage3Filter(rawCandidates);
  log(`${ticker}: ${filtered.length} after Stage 3`);

  if (filtered.length < 20) {
    const msg = `only ${filtered.length} candidates after Stage 3 (need ≥20)`;
    logErr(`${ticker}: ${msg}`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`).run(msg, company_id);
    return;
  }

  mkdirSync(REVIEW_QUEUE_DIR, { recursive: true });
  const batchPath = path.join(REVIEW_QUEUE_DIR, `${ticker}.json`);
  writeFileSync(batchPath, JSON.stringify({
    ticker,
    company_id,
    queued_at: new Date().toISOString(),
    status: 'pending',
    candidates_raw_count: rawCandidates.length,
    candidates: filtered,
  }, null, 2));

  db.prepare(`UPDATE phase2_jobs SET status='awaiting_ai_review', updated_at=datetime('now') WHERE company_id=?`).run(company_id);
  log(`${ticker}: ${filtered.length} candidates → review-queue/${ticker}.json (awaiting Claude Code session)`);
}

async function main() {
  const db = openDb();

  const conditions = ["status = 'extracted'"];
  const params = [];
  if (TICKER_FILTER) { conditions.push('ticker = ?'); params.push(TICKER_FILTER); }

  const jobs = db.prepare(
    `SELECT * FROM phase2_jobs WHERE ${conditions.join(' AND ')} ORDER BY created_at`
  ).all(...params);

  log(`Validator starting — ${jobs.length} job(s) to process`);

  for (const job of jobs) {
    try {
      await processCompany(db, job);
    } catch (e) {
      logErr(`Unhandled error for ${job.ticker}: ${e.message}`);
      db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`)
        .run(`unhandled: ${e.message}`, job.company_id);
    }
  }

  db.close();
  log('Validator done — run scripts/ingestion/process-review-queue.js to complete AI enrichment.');
}

main().catch(e => { logErr('Fatal:', e.message); process.exit(1); });
