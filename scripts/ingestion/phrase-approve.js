#!/usr/bin/env node
// phrase-approve.js — Score-then-auto-approve all ai_selected phrases in phrase_staging.
//
// For each company:
//   1. Pre-filter with FILLER_BLOCKLIST + STAGE3_REJECT_PATTERNS (hard rejects)
//   2. Score remaining with Claude Haiku 0–10 (bingo rubric)
//   3. For JPM/MRK/TRV (100 phrases): score all, bottom 50 by score → rejected
//   4. Thresholds: score >= 8 → approved, 5–7 → left for human, <= 4 → rejected
//
// If SUPABASE_SERVICE_ROLE_KEY is set: writes directly to phrase_staging.
// Otherwise: writes decisions to data/phrase-approve-decisions.json for MCP apply.
// Prints borderline phrases (5–7) per company so human knows what still needs review.
//
// Usage: node scripts/ingestion/phrase-approve.js [--ticker TICKER] [--dry-run]

import { writeFileSync } from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { log, logError, DATA_DIR } from "./lib/common.js";

const APPROVE_THRESHOLD = 8;
const REJECT_THRESHOLD = 4;
const TARGET_PER_COMPANY = 50;
const MODEL = "claude-haiku-4-5-20251001";

// ─── Supabase clients ─────────────────────────────────────────────────────────

function getSupabaseRead() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env");
  return createClient(url, key);
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Pre-filter (hard rejects before scoring) ────────────────────────────────

const FILLER_BLOCKLIST = new Set([
  "going forward", "at this time", "at this point", "in terms of",
  "as well as", "as a result", "in addition to", "on behalf of",
  "in order to", "with respect to", "with regard to", "based on",
  "moving forward", "we believe that", "we continue to", "we are pleased",
  "very pleased", "very excited", "we remain focused", "remain focused",
  "on a year", "year over year", "basis points", "earnings per share",
  "good afternoon everyone", "good morning everyone", "good evening everyone",
  "thank you for joining", "thank you for joining us", "thank you operator",
  "for your question", "for the question", "questions and answers",
  "our next question", "your next question", "next question please",
  "please go ahead", "you may proceed", "open the line", "open for questions",
  "joining the call", "on the call today", "on the call with us",
  "conference call", "earnings conference", "earnings call today",
  "thanks for joining", "thanks for taking", "taking my question",
  "taking our question", "morning everyone", "good morning", "good afternoon",
  "listen only mode", "listen-only mode", "disconnect your lines",
  "your line is now", "first question", "let me turn", "my pleasure",
  "following our prepared", "during the quarter", "during the call",
  "differ materially", "actual results", "forward looking", "forward-looking",
  "cautionary statement", "safe harbor", "among other things", "without limitation",
  "filings with the sec", "sec filings", "risk factors", "closing comments",
  "factors identified", "cautionary note", "statements regarding",
  "regarding future events", "change without notice", "subject to change",
  "express implied", "believe to be reliable", "basis of investment",
  "construed as advice", "constructed as advice", "available data",
  "associated with the use", "including without", "hereunder including",
  "arising under", "losses arising", "damages including", "employees including",
  "solely for information", "published solely", "beliefs of factset",
  "call is being recorded", "accompanying slide", "forward to speaking",
  "include forward-looking", "question during the call", "joining us today",
  "like to turn", "let me turn the", "please limit yourself",
  "limit yourself to one", "approximately billion", "approximately million",
  "approximately percent", "approximately basis", "beginning and ending",
  "trailing twelve months", "twelve months return", "months return on",
  "return on invested",
]);

const STAGE3_REJECT_PATTERNS = [
  /\bpercent\b/,
  /\bquarter of\b/,
  /\bquarter our\b/,
  /\brate was\b/,
  /\bfrom last year\b/,
  /\bof last year\b/,
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
  /accuracy (completeness|integrity)/,
  /any (implied|indirect|information)/,
  /lost profits/,
  /advice designed/,
  /answer section/,
  /including the writer/,
];

function isHardReject(phrase) {
  if (FILLER_BLOCKLIST.has(phrase)) return true;
  if (STAGE3_REJECT_PATTERNS.some((rx) => rx.test(phrase))) return true;
  return false;
}

// ─── Haiku scoring ────────────────────────────────────────────────────────────

async function scorePhrases(client, phrases, companyId) {
  const BATCH = 50;
  const scores = new Map();

  for (let i = 0; i < phrases.length; i += BATCH) {
    const batch = phrases.slice(i, i + BATCH);
    const numbered = batch
      .map((r, j) => `${i + j}. "${r.phrase}"`)
      .join("\n");

    const prompt = `Score these phrase candidates for a ${companyId.toUpperCase()} earnings call BINGO game.

Players mark phrases when they hear executives say them live. Score for SPEAKING STYLE, not subject matter.

Score 0–10:
- 8-10: Executive idiom, rhetorical framing, or CEO buzzword. Company-specific verbal tic. ("double down", "playing offense", "our flywheel", "unlocking value")
- 5-7: Recurring company language, somewhat distinctive, not pure boilerplate.
- 2-4: Topic label (geography, product, metric) or generic term any company could say.
- 0-1: Legal boilerplate, call ceremony filler, analyst question, person name, operator instructions.

CANDIDATES:
${numbered}

Return ONLY a JSON array of {index, score} in order. No explanation. Example: [{"index":0,"score":7},{"index":1,"score":2}]`;

    let attempt = 0;
    while (true) {
      try {
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });

        const raw = response.content[0].text
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/, "");
        let ratings;
        try {
          ratings = JSON.parse(raw);
        } catch {
          ratings = [];
        }

        for (const r of ratings) {
          if (typeof r.index === "number" && r.index < phrases.length) {
            scores.set(phrases[r.index].id, r.score ?? 0);
          }
        }
        break;
      } catch (err) {
        if (err.status === 429 && attempt < 3) {
          attempt++;
          const wait = 65 * attempt;
          log(`  rate limited — waiting ${wait}s (attempt ${attempt}/3)`);
          await new Promise((r) => setTimeout(r, wait * 1000));
        } else {
          throw err;
        }
      }
    }
  }

  return scores;
}

// ─── Per-company processing ───────────────────────────────────────────────────

async function processCompany(supabase, anthropic, companyId, rows, dryRun) {
  log(`\n--- ${companyId.toUpperCase()}: ${rows.length} ai_selected ---`);

  // Step 1: hard-reject before scoring
  const hardRejected = rows.filter((r) => isHardReject(r.phrase));
  const toScore = rows.filter((r) => !isHardReject(r.phrase));
  if (hardRejected.length > 0) {
    log(`  ${hardRejected.length} hard-rejected (blocklist/pattern match)`);
  }

  // Step 2: score with Haiku
  log(`  Scoring ${toScore.length} candidates with Haiku`);
  const scores = await scorePhrases(anthropic, toScore, companyId);

  // Attach scores
  const scored = toScore
    .map((r) => ({ ...r, score: scores.get(r.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  // Step 3: for 100-phrase companies, bottom 50 by score → rejected
  let candidates = scored;
  let bottomRejected = [];
  if (rows.length > TARGET_PER_COMPANY) {
    candidates = scored.slice(0, TARGET_PER_COMPANY);
    bottomRejected = scored.slice(TARGET_PER_COMPANY);
    log(`  Bottom ${bottomRejected.length} by score → rejected (over target of ${TARGET_PER_COMPANY})`);
  }

  // Step 4: apply thresholds
  const approved = candidates.filter((r) => r.score >= APPROVE_THRESHOLD);
  const borderline = candidates.filter(
    (r) => r.score > REJECT_THRESHOLD && r.score < APPROVE_THRESHOLD
  );
  const rejected = [
    ...hardRejected,
    ...bottomRejected,
    ...candidates.filter((r) => r.score <= REJECT_THRESHOLD),
  ];

  log(
    `  → approved: ${approved.length}  borderline (human review): ${borderline.length}  rejected: ${rejected.length}`
  );

  if (borderline.length > 0) {
    log(`  Borderline phrases (score 5–7) — review in admin panel:`);
    for (const r of borderline) {
      log(`    [${r.score}] "${r.phrase}"`);
    }
  }

  const decisions = {
    approved: approved.map((r) => r.id),
    rejected: [...hardRejected, ...bottomRejected, ...candidates.filter((r) => r.score <= REJECT_THRESHOLD)].map((r) => r.id),
    borderline: borderline.map((r) => ({ id: r.id, phrase: r.phrase, score: r.score })),
  };

  if (dryRun) {
    log(`  DRY RUN — no updates written`);
    return { approved: approved.length, borderline: borderline.length, rejected: decisions.rejected.length, decisions };
  }

  // Step 5: write to Supabase (service role) or return decisions for MCP apply
  if (!supabase) {
    return { approved: approved.length, borderline: borderline.length, rejected: decisions.rejected.length, decisions };
  }

  if (approved.length > 0) {
    const { error } = await supabase
      .from("phrase_staging")
      .update({ status: "approved" })
      .in("id", decisions.approved);
    if (error) throw new Error(`approve update failed: ${error.message}`);
  }

  if (decisions.rejected.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < decisions.rejected.length; i += CHUNK) {
      const chunk = decisions.rejected.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("phrase_staging")
        .update({ status: "rejected" })
        .in("id", chunk);
      if (error) throw new Error(`reject update failed: ${error.message}`);
    }
  }

  return { approved: approved.length, borderline: borderline.length, rejected: decisions.rejected.length, decisions };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker") out.ticker = args[++i]?.toUpperCase();
    if (args[i] === "--dry-run") out.dryRun = true;
  }
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    logError("ANTHROPIC_API_KEY is required");
    process.exit(1);
  }

  const { ticker: tickerFilter, dryRun } = parseArgs();
  if (dryRun) log("DRY RUN mode — no Supabase writes");

  const supabaseRead = getSupabaseRead();
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin && !dryRun) {
    log("SUPABASE_SERVICE_ROLE_KEY not found — will write decisions to data/phrase-approve-decisions.json for manual MCP apply");
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Load all ai_selected rows (anon key — SELECT is public)
  let query = supabaseRead
    .from("phrase_staging")
    .select("id, company_id, phrase, nlp_score")
    .eq("status", "ai_selected")
    .order("nlp_score", { ascending: false });

  if (tickerFilter) {
    const companyId = tickerFilter.toLowerCase();
    query = query.eq("company_id", companyId);
  }

  const { data: rows, error } = await query;
  if (error) { logError("Failed to load phrases:", error.message); process.exit(1); }
  if (!rows?.length) { log("No ai_selected phrases found"); process.exit(0); }

  // Group by company
  const byCompany = new Map();
  for (const row of rows) {
    if (!byCompany.has(row.company_id)) byCompany.set(row.company_id, []);
    byCompany.get(row.company_id).push(row);
  }

  log(`Loaded ${rows.length} ai_selected phrases across ${byCompany.size} companies`);

  const summary = [];
  const allDecisions = {};
  for (const [companyId, companyRows] of byCompany) {
    try {
      const result = await processCompany(supabaseAdmin, anthropic, companyId, companyRows, dryRun);
      summary.push({ companyId, ...result });
      allDecisions[companyId] = result.decisions;
    } catch (e) {
      logError(`${companyId}: failed — ${e.message}`);
      summary.push({ companyId, error: e.message });
    }
  }

  log("\n═══ SUMMARY ═══");
  for (const s of summary) {
    if (s.error) {
      log(`  ${s.companyId.toUpperCase()}: ERROR — ${s.error}`);
    } else {
      const activation = s.approved >= 50 ? "✓ activation-ready" : `needs ${50 - s.approved} more approvals`;
      log(`  ${s.companyId.toUpperCase()}: ${s.approved} approved, ${s.borderline} for human review, ${s.rejected} rejected  [${activation}]`);
    }
  }

  // If no service role key, write decisions file for MCP apply
  if (!supabaseAdmin && !dryRun) {
    const decisionsPath = path.join(DATA_DIR, "phrase-approve-decisions.json");
    writeFileSync(decisionsPath, JSON.stringify(allDecisions, null, 2));
    log(`\nDecisions written to data/phrase-approve-decisions.json — apply via MCP execute_sql`);
  }
}

main().catch((e) => { logError("Fatal:", e.message); process.exit(1); });
