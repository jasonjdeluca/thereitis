#!/usr/bin/env node
// ai-select.js — Stage 4: AI phrase selection.
// Reads 'pending' rows from phrase_staging for a given ticker, batches them
// to Claude Haiku, and marks the top 40-50 as 'ai_selected'. All remaining
// pending rows for that company are marked 'ai_rejected'.
//
// Usage: node --env-file=.env scripts/ingestion/ai-select.js --ticker MSFT

import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { companyIdForTicker, log, logError, REPO_ROOT } from "./lib/common.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BATCH_SIZE = 150;
const TARGET_TOTAL = 50;
const BATCH_TARGET = 20; // aim to select this many per batch; dedup + score cap at 50 total
const MODEL = "claude-haiku-4-5-20251001";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env",
    );
  }
  return createClient(url, key);
}

function loadRubric() {
  const rubricPath = path.join(REPO_ROOT, "docs/program/CONTENT_QA_RUBRIC.md");
  return readFileSync(rubricPath, "utf8");
}

function buildSystemPrompt(rubric, companyName) {
  return `You are a content quality reviewer for a real-time earnings call bingo game called "There It Is". Players mark phrases on their 5x5 bingo cards when they hear executives say them live on earnings calls.

You are reviewing phrase candidates extracted from ${companyName} earnings call transcripts.

## Content QA Rubric

${rubric}

## Your task

You will receive a batch of phrase candidates. For each batch, select the phrases that would make the best bingo squares. Return ONLY a valid JSON array of IDs — no explanation, no markdown fences, no other text.

Selection criteria summary (from rubric):
- SPECIFIC to this company — a knowing player would immediately recognize it
- PLAYABLE — short, punchy, causes the "there it is" moment
- CEO MODE — executive voice, forward-looking, optimistic, buzzword-rich
- NOT too_generic (no "strong performance", "revenue growth")
- NOT jargon_heavy (no "adjusted EBITDA", "basis points")
- NOT analyst_question (no questions from the floor)
- NOT boilerplate_opener (no "good morning everyone")
- Under 25 characters including spaces

Aim to select ${BATCH_TARGET}–${Math.round(BATCH_TARGET * 1.5)} phrases per batch.`;
}

async function selectBatch(client, systemPrompt, batch) {
  const lines = batch
    .map((r) => `ID:${r.id} | "${r.phrase}" | score:${r.nlp_score.toFixed(2)}`)
    .join("\n");

  const userContent = `Select the best bingo-worthy phrases from this batch of ${batch.length} candidates.

${lines}

Return a JSON array of the selected IDs only. Example: ["uuid1","uuid2","uuid3"]`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0]?.text?.trim() || "[]";

  // Extract the first JSON array from the response, regardless of surrounding text.
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (!arrayMatch) {
    return []; // Haiku determined no phrases worthy of selection
  }
  try {
    const parsed = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed.filter((id) => typeof id === "string");
  } catch {
    logError(`Batch parse failed. Raw response: ${text.slice(0, 200)}`);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run({ ticker }) {
  if (!ticker) {
    logError("Usage: node ai-select.js --ticker TICKER");
    process.exit(1);
  }

  const upperTicker = ticker.toUpperCase();
  const companyId = companyIdForTicker(upperTicker);
  log(`ai-select: ticker=${upperTicker} company_id=${companyId}`);

  const supabase = getSupabase();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── 1. Load pending rows (paginate past Supabase's 1000-row default) ───────

  const rows = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error: fetchErr } = await supabase
      .from("phrase_staging")
      .select("id, phrase, nlp_score, nlp_flags, source_quarter")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .order("nlp_score", { ascending: false })
      .range(offset, offset + PAGE - 1);

    if (fetchErr) {
      logError("Failed to fetch pending rows:", fetchErr.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  if (rows.length === 0) {
    log("No pending rows found — nothing to do.");
    return;
  }
  log(`  Loaded ${rows.length} pending rows`);

  // ── 2. Load rubric + build system prompt ───────────────────────────────────

  const rubric = loadRubric();

  // Attempt to get the company name from Supabase for the system prompt.
  const { data: companyRow } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();
  const companyName = companyRow?.name || upperTicker;

  const systemPrompt = buildSystemPrompt(rubric, companyName);

  // ── 3. Batch and call Haiku ────────────────────────────────────────────────

  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }
  log(`  Sending ${batches.length} batches (${BATCH_SIZE} phrases each)`);

  const allSelectedIds = new Set();
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    log(`  Batch ${i + 1}/${batches.length} (${batch.length} phrases)…`);
    const selected = await selectBatch(anthropic, systemPrompt, batch);
    selected.forEach((id) => allSelectedIds.add(id));
    log(`    → ${selected.length} selected (running total: ${allSelectedIds.size})`);
  }

  // ── 4. Resolve final top-50 by nlp_score ──────────────────────────────────

  const rowById = new Map(rows.map((r) => [r.id, r]));
  const selectedRows = [...allSelectedIds]
    .filter((id) => rowById.has(id))
    .map((id) => rowById.get(id))
    .sort((a, b) => b.nlp_score - a.nlp_score)
    .slice(0, TARGET_TOTAL);

  const finalIds = new Set(selectedRows.map((r) => r.id));
  const rejectIds = rows.map((r) => r.id).filter((id) => !finalIds.has(id));

  log(
    `  Final selection: ${finalIds.size} ai_selected, ${rejectIds.length} ai_rejected`,
  );

  if (finalIds.size === 0) {
    logError("No phrases selected — aborting status updates.");
    process.exit(1);
  }

  // ── 5. Update phrase_staging ───────────────────────────────────────────────

  // Mark selected rows ai_selected using their IDs in chunks (small set, ~50).
  const SEL_CHUNK = 100;
  const selectedIdList = [...finalIds];
  for (let i = 0; i < selectedIdList.length; i += SEL_CHUNK) {
    const chunk = selectedIdList.slice(i, i + SEL_CHUNK);
    const { error: selErr } = await supabase
      .from("phrase_staging")
      .update({ status: "ai_selected" })
      .in("id", chunk);
    if (selErr) {
      logError("Failed to update ai_selected rows:", selErr.message);
      process.exit(1);
    }
  }

  // Mark ALL remaining pending rows for this company as ai_rejected using a
  // WHERE clause instead of an ID list — avoids URL-length limits and races.
  const { error: rejErr } = await supabase
    .from("phrase_staging")
    .update({ status: "ai_rejected" })
    .eq("company_id", companyId)
    .eq("status", "pending");
  if (rejErr) {
    logError("Failed to update ai_rejected rows:", rejErr.message);
    process.exit(1);
  }

  // ── 6. Summary ────────────────────────────────────────────────────────────

  log("ai-select complete:");
  log(`  Total pending processed: ${rows.length}`);
  log(`  ai_selected: ${finalIds.size}`);
  log(`  ai_rejected: ${rejectIds.length}`);
  log("  Top 10 selected phrases:");
  selectedRows.slice(0, 10).forEach((r, i) => {
    log(`    ${i + 1}. "${r.phrase}" (score: ${r.nlp_score.toFixed(2)})`);
  });
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker") out.ticker = args[++i];
  }
  return out;
}

run(parseArgs()).catch((err) => {
  logError("ai-select failed:", err.message);
  process.exit(1);
});
