#!/usr/bin/env node
// staging-writer.js — Stage 4.
// Writes valid candidates into the Supabase phrase_staging table (status
// 'pending') for human review. Resolves company_id from the ticker, skips
// candidates whose company row does not exist, and skips phrases already staged.

import { fileURLToPath } from "url";
import path from "path";
import {
  getDb,
  getSupabase,
  log,
  logError,
  companyIdForTicker,
} from "./lib/common.js";

async function companyExists(supabase, companyId, cache) {
  if (companyId in cache) return cache[companyId];
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw new Error(`companies lookup failed: ${error.message}`);
  const exists = !!data;
  cache[companyId] = exists;
  return exists;
}

// Pre-load existing non-rejected phrase_staging rows for the relevant companies.
async function loadStaged(supabase, companyIds) {
  const seen = new Set();
  if (companyIds.length === 0) return seen;
  const { data, error } = await supabase
    .from("phrase_staging")
    .select("company_id, phrase, status")
    .in("company_id", companyIds);
  if (error) {
    // Surface "table does not exist" clearly to the caller.
    throw error;
  }
  for (const r of data || []) {
    if (r.status !== "rejected") {
      seen.add(`${r.company_id}\n${(r.phrase || "").toLowerCase()}`);
    }
  }
  return seen;
}

export async function runStagingWriter({ ticker = null } = {}) {
  const db = getDb();
  const supabase = getSupabase();
  const filterTicker = ticker ? ticker.toUpperCase() : null;

  let query = `
    SELECT c.*, q.url AS q_url, q.source_type AS q_source_type
    FROM candidates c
    JOIN queue q ON c.queue_id = q.id
    WHERE c.validation_status = 'valid'
  `;
  const params = [];
  if (filterTicker) {
    query += " AND c.ticker = ?";
    params.push(filterTicker);
  }
  const rows = db.prepare(query).all(...params);
  log(`Staging writer starting — ${rows.length} valid candidate(s).`);

  // Resolve company ids and which exist.
  const companyCache = {};
  const tickerToCompany = {};
  const noCompanyTickers = new Set();
  for (const tk of new Set(rows.map((r) => r.ticker))) {
    const companyId = companyIdForTicker(tk);
    tickerToCompany[tk] = companyId;
    const exists = await companyExists(supabase, companyId, companyCache);
    if (!exists) noCompanyTickers.add(tk);
  }

  const activeCompanyIds = [
    ...new Set(
      rows
        .filter((r) => !noCompanyTickers.has(r.ticker))
        .map((r) => tickerToCompany[r.ticker]),
    ),
  ];

  let seen;
  try {
    seen = await loadStaged(supabase, activeCompanyIds);
  } catch (err) {
    logError(
      "Could not read phrase_staging — the table may not exist yet. " +
        "Run the Task 1 migration SQL in Supabase first.",
    );
    logError(`  (${err.message})`);
    db.close();
    process.exitCode = 1;
    throw new Error("phrase_staging unavailable");
  }

  let written = 0;
  let skippedExisting = 0;
  let skippedNoCompany = 0;
  const stagedByQueue = {};

  for (const row of rows) {
    if (noCompanyTickers.has(row.ticker)) {
      skippedNoCompany++;
      continue;
    }
    const companyId = tickerToCompany[row.ticker];
    const key = `${companyId}\n${row.phrase.toLowerCase()}`;
    if (seen.has(key)) {
      skippedExisting++;
      continue;
    }

    let flags = [];
    try {
      flags = JSON.parse(row.nlp_flags || "[]");
    } catch {
      flags = [];
    }

    const { error } = await supabase.from("phrase_staging").insert({
      company_id: companyId,
      phrase: row.phrase,
      source_ticker: row.ticker,
      source_quarter: row.fiscal_quarter,
      source_url: row.q_url,
      source_type: row.q_source_type,
      nlp_score: row.nlp_score,
      nlp_flags: flags,
      status: "pending",
    });

    if (error) {
      logError(`  ✗ insert failed for "${row.phrase}": ${error.message}`);
      continue;
    }

    seen.add(key);
    written++;
    stagedByQueue[row.queue_id] = (stagedByQueue[row.queue_id] || 0) + 1;
  }

  // Update queue phrases_staged counts.
  const updateQueue = db.prepare(
    "UPDATE queue SET phrases_staged = ?, updated_at = datetime('now') WHERE id = ?",
  );
  const updateMany = db.transaction((entries) => {
    for (const [queueId, count] of entries) updateQueue.run(count, queueId);
  });
  updateMany(Object.entries(stagedByQueue));

  // ─── Summary ──────────────────────────────────────────────────────────────
  log("Staging writer complete.");
  log(`  Written to phrase_staging: ${written}`);
  log(`  Skipped (already staged): ${skippedExisting}`);
  log(
    `  Skipped (no company row): ${skippedNoCompany}` +
      (noCompanyTickers.size
        ? ` [${[...noCompanyTickers].join(", ")}]`
        : ""),
  );

  db.close();
  return {
    written,
    skippedExisting,
    skippedNoCompany,
    noCompanyTickers: [...noCompanyTickers],
  };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker") out.ticker = args[++i];
  }
  return out;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runStagingWriter(parseArgs()).catch((err) => {
    logError("staging-writer failed:", err.message);
    process.exit(1);
  });
}
