#!/usr/bin/env node
// validator.js — Stage 3.
// Applies deterministic validation rules to pending candidates, marking each
// valid or rejected (with a reason). Also flags candidates that already exist in
// the live Supabase phrases table as duplicate_in_live — flagged, not rejected.

import { fileURLToPath } from "url";
import path from "path";
import { getDb, getSupabase, log, logError } from "./lib/common.js";

const MAX_PHRASE_CHARS = 25;

// Returns { status, reason } — first failing rule wins.
function validatePhrase(phrase, flags) {
  if (phrase.length > MAX_PHRASE_CHARS) {
    return { status: "rejected", reason: "exceeds_25_chars" };
  }
  if (!phrase.trim()) {
    return { status: "rejected", reason: "blank" };
  }
  if (flags.includes("possible_person_name")) {
    return { status: "rejected", reason: "possible_person_name" };
  }
  if (phrase === phrase.toUpperCase() && /[A-Z]/.test(phrase)) {
    return { status: "rejected", reason: "all_caps" };
  }
  if (!phrase.includes(" ")) {
    return { status: "rejected", reason: "single_word" };
  }
  return { status: "valid", reason: null };
}

async function loadLivePhrases() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("phrases").select("phrase");
  if (error) {
    throw new Error(`Supabase phrases query failed: ${error.message}`);
  }
  return new Set((data || []).map((r) => (r.phrase || "").toLowerCase()));
}

export async function runValidator({ ticker = null } = {}) {
  const db = getDb();
  const filterTicker = ticker ? ticker.toUpperCase() : null;

  const livePhrases = await loadLivePhrases();
  log(`Loaded ${livePhrases.size} live phrase(s) for duplicate detection.`);

  let query = "SELECT * FROM candidates WHERE validation_status = 'pending'";
  const params = [];
  if (filterTicker) {
    query += " AND ticker = ?";
    params.push(filterTicker);
  }
  const rows = db.prepare(query).all(...params);
  log(`Validator starting — ${rows.length} candidate(s) to validate.`);

  const update = db.prepare(
    "UPDATE candidates SET validation_status = ?, rejection_reason = ?, nlp_flags = ? WHERE id = ?",
  );

  let valid = 0;
  let rejected = 0;
  let dupFlagged = 0;
  const reasons = {};

  const apply = db.transaction((items) => {
    for (const row of items) {
      let flags = [];
      try {
        flags = JSON.parse(row.nlp_flags || "[]");
      } catch {
        flags = [];
      }

      const { status, reason } = validatePhrase(row.phrase, flags);

      // Cross-company duplicate flag (does not reject).
      if (livePhrases.has(row.phrase.toLowerCase()) && !flags.includes("duplicate_in_live")) {
        flags.push("duplicate_in_live");
        dupFlagged++;
      }

      update.run(status, reason, JSON.stringify(flags), row.id);

      if (status === "valid") valid++;
      else {
        rejected++;
        reasons[reason] = (reasons[reason] || 0) + 1;
      }
    }
  });
  apply(rows);

  // ─── Summary ──────────────────────────────────────────────────────────────
  log("Validator complete.");
  log(`  Valid: ${valid}`);
  log(`  Rejected: ${rejected}`);
  for (const [reason, n] of Object.entries(reasons)) {
    log(`    ${reason}: ${n}`);
  }
  log(`  Flagged duplicate_in_live: ${dupFlagged}`);

  db.close();
  return { valid, rejected, dupFlagged, reasons };
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
  runValidator(parseArgs()).catch((err) => {
    logError("validator failed:", err.message);
    process.exit(1);
  });
}
