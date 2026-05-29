#!/usr/bin/env node
// run-pipeline.js — orchestrator.
// Runs all five ingestion stages in sequence for a single ticker and prints a
// summary table of counts at each stage.
//
// Usage: node scripts/ingestion/run-pipeline.js --ticker MSFT

import { fileURLToPath } from "url";
import path from "path";
import { getDb, log, logError } from "./lib/common.js";
import { buildQueue } from "./queue-builder.js";
import { runFetcher } from "./fetcher.js";
import { runExtractor } from "./extractor.js";
import { runValidator } from "./validator.js";
import { runStagingWriter } from "./staging-writer.js";

function queueRowCount(ticker) {
  const db = getDb();
  const { n } = db
    .prepare("SELECT COUNT(*) AS n FROM queue WHERE ticker = ?")
    .get(ticker);
  db.close();
  return n;
}

function gatherCounts(ticker) {
  const db = getDb();
  const q = (sql, ...p) => db.prepare(sql).get(ticker, ...p);
  const counts = {
    queueTotal: q("SELECT COUNT(*) AS n FROM queue WHERE ticker = ?").n,
    queuePending: q(
      "SELECT COUNT(*) AS n FROM queue WHERE ticker = ? AND fetch_status = 'pending'",
    ).n,
    fetched: q(
      "SELECT COUNT(*) AS n FROM queue WHERE ticker = ? AND fetch_status = 'fetched'",
    ).n,
    failed: q(
      "SELECT COUNT(*) AS n FROM queue WHERE ticker = ? AND fetch_status = 'failed'",
    ).n,
    candidates: q(
      "SELECT COUNT(*) AS n FROM candidates WHERE ticker = ?",
    ).n,
    valid: q(
      "SELECT COUNT(*) AS n FROM candidates WHERE ticker = ? AND validation_status = 'valid'",
    ).n,
    rejected: q(
      "SELECT COUNT(*) AS n FROM candidates WHERE ticker = ? AND validation_status = 'rejected'",
    ).n,
    staged: q(
      "SELECT COALESCE(SUM(phrases_staged),0) AS n FROM queue WHERE ticker = ?",
    ).n,
  };
  // Distinct phrases (candidates are stored per-quarter, so collapse to the
  // best score per phrase) — a readable "top phrases found" report.
  const topPhrases = db
    .prepare(
      `SELECT phrase, MAX(nlp_score) AS nlp_score, MAX(frequency) AS frequency
       FROM candidates
       WHERE ticker = ? AND validation_status = 'valid'
       GROUP BY LOWER(phrase)
       ORDER BY nlp_score DESC, frequency DESC
       LIMIT 10`,
    )
    .all(ticker);
  db.close();
  return { counts, topPhrases };
}

async function runStage(name, fn) {
  log(`\n──────── Stage: ${name} ────────`);
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let ticker = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker") ticker = args[++i];
  }
  if (!ticker) {
    logError("Usage: node scripts/ingestion/run-pipeline.js --ticker <TICKER>");
    process.exit(1);
  }
  ticker = ticker.toUpperCase();
  log(`Running full ingestion pipeline for ${ticker}.`);

  // Stage 0 — queue-builder (only if no rows exist yet for this ticker).
  if (queueRowCount(ticker) === 0) {
    const r = await runStage("queue-builder", () => buildQueue({ ticker }));
    if (!r.ok) {
      logError(`queue-builder failed: ${r.error.message}`);
      process.exit(1);
    }
  } else {
    log(`\n──────── Stage: queue-builder ────────`);
    log(`Queue rows already exist for ${ticker} — skipping build.`);
  }

  // Stage 1 — fetcher (this ticker, no limit).
  let r = await runStage("fetcher", () => runFetcher({ ticker, limit: null }));
  if (!r.ok) {
    logError(`fetcher failed: ${r.error.message}`);
    process.exit(1);
  }

  // Stage 2 — extractor.
  r = await runStage("extractor", () => runExtractor({ ticker }));
  if (!r.ok) {
    logError(`extractor failed: ${r.error.message}`);
    process.exit(1);
  }

  // Stage 3 — validator.
  r = await runStage("validator", () => runValidator({ ticker }));
  if (!r.ok) {
    logError(`validator failed: ${r.error.message}`);
    process.exit(1);
  }

  // Stage 4 — staging-writer. A missing phrase_staging table is a known
  // precondition (human must run the Task 1 migration SQL), not a code failure.
  let stagingNote = null;
  r = await runStage("staging-writer", () => runStagingWriter({ ticker }));
  if (!r.ok) {
    if (r.error.message === "phrase_staging unavailable") {
      stagingNote =
        "SKIPPED — phrase_staging table does not exist. Run the Task 1 migration SQL in Supabase, then re-run staging-writer.";
      log(stagingNote);
    } else {
      logError(`staging-writer failed: ${r.error.message}`);
      process.exit(1);
    }
  }

  // ─── Final summary ──────────────────────────────────────────────────────────
  const { counts, topPhrases } = gatherCounts(ticker);
  log(`\n════════ Pipeline summary: ${ticker} ════════`);
  const table = [
    ["queue rows", counts.queueTotal],
    ["  still pending", counts.queuePending],
    ["fetched", counts.fetched],
    ["fetch failed", counts.failed],
    ["candidates extracted", counts.candidates],
    ["candidates valid", counts.valid],
    ["candidates rejected", counts.rejected],
    [
      "written to phrase_staging",
      stagingNote ? "n/a (migration required)" : counts.staged,
    ],
  ];
  for (const [label, value] of table) {
    log(`  ${label.padEnd(28)} ${value}`);
  }

  log(`\n  Top 10 highest-scoring valid phrases:`);
  if (topPhrases.length === 0) {
    log("    (none)");
  } else {
    topPhrases.forEach((p, i) => {
      log(
        `    ${String(i + 1).padStart(2)}. [score ${p.nlp_score}] "${p.phrase}" (freq ${p.frequency})`,
      );
    });
  }

  if (stagingNote) log(`\n  NOTE: ${stagingNote}`);
  log("\nPipeline complete.");
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err) => {
    logError("run-pipeline failed:", err.message);
    process.exit(1);
  });
}
