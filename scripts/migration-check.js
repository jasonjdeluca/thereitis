#!/usr/bin/env node
// migration-check.js — audits supabase/migrations/ for naming convention violations,
// duplicate timestamps, and unusually large gaps between consecutive migrations.
// Output: reports/migration-check.json

import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../supabase/migrations");
const REPORTS_DIR = join(__dirname, "../reports");

// 30 days expressed as a 14-digit timestamp delta.
// Format: YYYYMMDDHHmmss — 30 days = 30 * 24 * 60 * 60 = 2592000 seconds.
// We parse the timestamp as a Date to compute real elapsed seconds.
const GAP_WARN_SECONDS = 30 * 24 * 60 * 60;

function parseTimestamp(ts) {
  // ts: "20260528123456" → Date
  const y = ts.slice(0, 4);
  const mo = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const h = ts.slice(8, 10);
  const mi = ts.slice(10, 12);
  const s = ts.slice(12, 14);
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}

function run() {
  let files;
  try {
    files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql"));
  } catch (err) {
    console.error("ERROR reading migrations directory:", err.message);
    process.exit(1);
  }

  const issues = [];
  const VALID_PATTERN = /^(\d{14})_[a-z0-9_]+\.sql$/;
  const timestampSeen = {};
  const validFiles = [];

  for (const filename of files) {
    const match = filename.match(VALID_PATTERN);
    if (!match) {
      issues.push({ type: "invalid_filename", filename, detail: "Does not match YYYYMMDDHHMMSS_description.sql" });
      continue;
    }

    const ts = match[1];

    // Duplicate timestamp check
    if (timestampSeen[ts]) {
      issues.push({ type: "duplicate_timestamp", filename, detail: `Timestamp ${ts} also used by ${timestampSeen[ts]}` });
    } else {
      timestampSeen[ts] = filename;
      validFiles.push({ filename, ts, date: parseTimestamp(ts) });
    }
  }

  // Sort by timestamp and check for large gaps
  validFiles.sort((a, b) => a.ts.localeCompare(b.ts));
  for (let i = 1; i < validFiles.length; i++) {
    const prev = validFiles[i - 1];
    const curr = validFiles[i];
    const gapSeconds = (curr.date - prev.date) / 1000;
    if (gapSeconds > GAP_WARN_SECONDS) {
      const gapDays = Math.round(gapSeconds / 86400);
      issues.push({
        type: "large_gap",
        filename: curr.filename,
        detail: `${gapDays}-day gap before this migration (previous: ${prev.filename})`,
      });
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    migration_count: files.length,
    issues,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "migration-check.json"), JSON.stringify(report, null, 2));
  console.log(`migration-check: ${files.length} migrations, ${issues.length} issues`);
}

try {
  run();
} catch (err) {
  console.error("FATAL:", err.message);
  process.exit(1);
}
