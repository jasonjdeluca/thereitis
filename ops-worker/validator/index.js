#!/usr/bin/env node
// validator — Phase 2 Stages 3-5.
// Stage 3: structural filter on candidate_phrases.json
// Stage 4: AI enrichment via Claude Haiku → approved phrases + trivia
// Stage 5: hard validation + SQL generation + write to company-packs/{ticker}/generated/
// Env: ANTHROPIC_API_KEY (required), TICKER (optional)

import Database from 'better-sqlite3';
import Anthropic from '@anthropic-ai/sdk';
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
const MIN_APPROVED_PHRASES = 25;

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

function openDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

// Patterns that indicate non-executive language regardless of frequency.
// These are applied AFTER the blocklist — catch structural boilerplate
// that the phrase-level blocklist misses.
const STAGE3_REJECT_PATTERNS = [
  // Financial formula fragments
  /\bpercent\b/,              // "X percent of Y", "rate was percent"
  /\bquarter of\b/,           // "quarter of last year"
  /\bquarter our\b/,          // "quarter our gross margin"
  /\brate was\b/,
  /\bfrom last year\b/,
  /\bof last year\b/,
  // Legal boilerplate — FactSet, forward-looking disclaimers
  /hereunder/,
  /arising under/,
  /\bdamages\b/,
  /\bwarranties\b/,
  /\bliabilit/,               // liability / liabilities
  /\bstatutory\b/,
  /\bsolely for\b/,
  /\bpublished solely\b/,
  /\blosses arising\b/,
  /reform act/,
  /\bmeaning of the\b/,       // "within the meaning of the..."
  /\bact of including\b/,
  /\bincluding without\b/,    // "including without limitation"
  /including any reliance/,
  /beliefs of factset/,
  /\bfactset\b/,
  /\bcorrected transcript\b/,
  /\bsolely for information\b/,
  /\bquarterly reports\b/,
  /on form \d/i,              // "on Form 10-K"
  /\bassumptions regarding\b/,
  /\bcontrol including\b/,
  // Call ceremony / roster
  /analyst\s+\w+/,            // "analyst morgan", "analyst ubs"
  /\bchief (executive|financial|operating)\b/,
  /\b(executive|financial) officer\b/,
  /\binvestor relations\b/,
  /earnings call\b/,
  /\baccompanying slide\b/,
  /\bcall is being recorded\b/,
  /and good morning/,         // "ted and good morning", "llc and good morning"
  /\bjoining us today\b/,
  /\bfollowing our prepared\b/,
  /\bduring the call\b/,
  /\bclosing comments\b/,
  /\bforward to speaking\b/,
  /\binclude forward-looking\b/,
  /\bquestion during\b/,
];

// Stage 3: structural filter — drops filler, enforces 25-char hard cap, min quarters
function stage3Filter(candidates) {
  return candidates
    .filter(c => {
      const p = c.phrase;
      if (p.length > MAX_PHRASE_CHARS) return false;
      if (c.quarter_count < MIN_STAGE3_QUARTERS) return false;
      if (FILLER_BLOCKLIST.has(p)) return false;
      // Reject all-caps acronyms
      if (/^[A-Z\s]{2,6}$/.test(p)) return false;
      // Reject patterns that indicate boilerplate / roster language
      if (STAGE3_REJECT_PATTERNS.some(rx => rx.test(p))) return false;
      return true;
    })
    .slice(0, STAGE3_MAX_CANDIDATES);
}

// Stage 4a: AI scores each candidate — returns index → score map.
// Haiku SCORES, code SELECTS. Eliminates hallucination entirely.
async function stage4Score(candidates, ticker, companyName) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const BATCH = 50;
  const scores = new Map(); // phrase → score

  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const numbered = batch
      .map((c, j) => `${i + j}. "${c.phrase}" (${c.quarter_count} quarters in transcripts)`)
      .join('\n');

    const prompt = `You are scoring phrase candidates for a ${companyName} earnings call BINGO game.

Players mark phrases on their cards when they hear executives say them live. The best bingo phrase causes a knowing groan or laugh — "there it is." Score for SPEAKING STYLE, not subject matter.

Score each phrase 0–10:
- 8-10: Executive idiom, rhetorical framing, or CEO buzzword. Sounds like something the speaker says to project confidence. Company-specific feel. ("double down", "playing offense", "unlocking value", "our flywheel")
- 5-7: Recurring company language, somewhat distinctive, not pure boilerplate.
- 2-4: Topic label (geographic, product, metric) or generic financial term. Any company could say it.
- 0-1: Boilerplate, legal text, ceremony filler, vendor disclaimer, operator instructions.

CANDIDATES:
${numbered}

Return ONLY a JSON array of {index, score} objects, one per candidate, in order. No explanation. Example: [{"index":0,"score":7},{"index":1,"score":2}]`;

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
  }

  return scores;
}

// Stage 4b: generate trivia separately (no phrase selection — avoids hallucination path)
async function stage4Trivia(ticker, companyName) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `Generate 15 trivia questions about ${companyName} (${ticker}) as a company — history, strategy, products, financials, milestones. Mix easy, medium, and hard difficulty.

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

// Stage 4: AI enrichment — score candidates, code selects top 50, generate trivia
async function stage4Enrich(candidates, ticker, companyName) {
  log(`${ticker}: Stage 4a — scoring ${candidates.length} candidates`);
  const scores = await stage4Score(candidates, ticker, companyName);

  // Select top 50 by AI score, with quarter_count as tiebreaker.
  // Only include phrases that were actually scored (guards against off-by-one in batching).
  const scored = candidates
    .filter(c => scores.has(c.phrase))
    .map(c => ({ ...c, ai_score: scores.get(c.phrase) }))
    .sort((a, b) => b.ai_score - a.ai_score || b.quarter_count - a.quarter_count);

  const selected = scored.slice(0, 50).map(c => c.phrase);

  log(`${ticker}: Stage 4b — generating trivia`);
  const trivia = await stage4Trivia(ticker, companyName);

  return { phrases: selected, trivia };
}

// Stage 5a: hard validation — enforces all project rules on AI output
function stage5Validate(aiOutput) {
  const issues = [];
  const approved = [];

  for (const phrase of aiOutput.phrases ?? []) {
    if (typeof phrase !== 'string') { issues.push(`non-string phrase skipped`); continue; }
    const p = phrase.trim();
    if (!p) { issues.push('blank phrase rejected'); continue; }
    if (p.length > MAX_PHRASE_CHARS) { issues.push(`too long (${p.length} chars): "${p}"`); continue; }
    // Person name check: two consecutive Title-cased words
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
    // Person name check in trivia text
    const allText = [q.question, q.option_a, q.option_b, q.option_c, q.option_d].join(' ');
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(allText)) {
      issues.push(`trivia contains possible person name — skipped`); continue;
    }
    triviaApproved.push(q);
  }

  return { approved, triviaApproved, issues };
}

// Stage 5b: generate migration SQL
function stage5Sql(companyId, ticker, approved, triviaApproved) {
  const esc = s => s.replace(/'/g, "''");

  const phraseRows = approved
    .map(p => `  ('${companyId}', '${esc(p)}', 'standard', 1, true, false)`)
    .join(',\n');

  const triviaRows = triviaApproved
    .map(q => `  ('${companyId}', '${esc(q.question)}', '${esc(q.option_a)}', '${esc(q.option_b)}', '${esc(q.option_c)}', '${esc(q.option_d)}', '${q.correct_answer}', 'earnings', 'medium', true)`)
    .join(',\n');

  return `-- ${ticker} phrase and trivia migration
-- Generated by thereitis ops-worker/validator
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

  db.prepare(`UPDATE phase2_jobs SET status='generating', updated_at=datetime('now') WHERE company_id=?`).run(company_id);

  let aiOutput;
  try {
    log(`${ticker}: Stage 4 — AI enrichment (${filtered.length} candidates → Claude Haiku)`);
    aiOutput = await stage4Enrich(filtered, ticker, ticker);
    log(`${ticker}: AI returned ${aiOutput.phrases?.length ?? 0} phrases, ${aiOutput.trivia?.length ?? 0} trivia`);
  } catch (e) {
    const msg = `Stage 4 AI failed: ${e.message}`;
    logErr(`${ticker}: ${msg}`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`).run(msg, company_id);
    return;
  }

  log(`${ticker}: Stage 5 — validation`);
  const { approved, triviaApproved, issues } = stage5Validate(aiOutput);
  log(`${ticker}: ${approved.length} phrases approved, ${triviaApproved.length} trivia, ${issues.length} issue(s)`);

  if (approved.length < MIN_APPROVED_PHRASES) {
    const msg = `only ${approved.length} phrases passed validation (need ≥${MIN_APPROVED_PHRASES})`;
    logErr(`${ticker}: ${msg}`);
    db.prepare(`UPDATE phase2_jobs SET status='validation_failed', error_message=?, updated_at=datetime('now') WHERE company_id=?`).run(msg, company_id);
    return;
  }

  const generatedDir = path.join(PACKS_DIR, ticker, 'generated');
  mkdirSync(generatedDir, { recursive: true });

  writeFileSync(path.join(generatedDir, 'phrases.json'), JSON.stringify(approved, null, 2));
  writeFileSync(path.join(generatedDir, 'trivia.json'), JSON.stringify(triviaApproved, null, 2));
  writeFileSync(path.join(generatedDir, 'validation_report.json'), JSON.stringify({
    ticker, company_id,
    generated_at: new Date().toISOString(),
    candidates_raw: rawCandidates.length,
    candidates_after_stage3: filtered.length,
    phrases_approved: approved.length,
    trivia_approved: triviaApproved.length,
    validation_issues: issues,
    ready_for_migration: approved.length >= 50,
  }, null, 2));
  writeFileSync(path.join(generatedDir, 'migration.sql'), stage5Sql(company_id, ticker, approved, triviaApproved));

  db.prepare(`UPDATE phase2_jobs SET status='ready_for_review', updated_at=datetime('now') WHERE company_id=?`).run(company_id);
  log(`${ticker}: done — ${approved.length} phrases, ${triviaApproved.length} trivia written to company-packs/${ticker}/generated/`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    logErr('ANTHROPIC_API_KEY is required');
    process.exit(1);
  }

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
  log('Validator done.');
}

main().catch(e => { logErr('Fatal:', e.message); process.exit(1); });
