#!/usr/bin/env node
// migration-check.js — audits supabase/migrations/ for naming convention violations,
// duplicate sequence numbers, and unusually large gaps between consecutive migrations.
// Output: reports/migration-check.json
//
// This project uses sequential NNN_description.sql numbering (e.g. 001_init.sql),
// not timestamp-based filenames. Gap detection is based on sequence number delta,
// not calendar time.

import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../supabase/migrations");
const REPORTS_DIR = join(__dirname, "../reports");

// Warn if consecutive sequence numbers jump by more than this amount.
const GAP_WARN_THRESHOLD = 10;

function run() {
  let files;
  try {
    files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql"));
  } catch (err) {
    console.error("ERROR reading migrations directory:", err.message);
    process.exit(1);
  }

  const issues = [];
  // Format: NNN_lowercase_description.sql (1 or more digits, underscore, lowercase/digits/underscores)
  const VALID_PATTERN = /^(\d+)_[a-z0-9_]+\.sql$/;
  const seqSeen = {};
  const validFiles = [];

  for (const filename of files) {
    const match = filename.match(VALID_PATTERN);
    if (!match) {
      issues.push({ type: "invalid_filename", filename, detail: "Does not match NNN_description.sql (lowercase, digits, underscores only)" });
      continue;
    }

    const seq = parseInt(match[1], 10);

    // Duplicate sequence number check
    if (seqSeen[seq] !== undefined) {
      issues.push({ type: "duplicate_sequence", filename, detail: `Sequence ${seq} also used by ${seqSeen[seq]}` });
    } else {
      seqSeen[seq] = filename;
      validFiles.push({ filename, seq });
    }
  }

  // Sort by sequence and check for large gaps
  validFiles.sort((a, b) => a.seq - b.seq);
  for (let i = 1; i < validFiles.length; i++) {
    const prev = validFiles[i - 1];
    const curr = validFiles[i];
    const gap = curr.seq - prev.seq;
    if (gap > GAP_WARN_THRESHOLD) {
      issues.push({
        type: "large_gap",
        filename: curr.filename,
        detail: `Sequence gap of ${gap} before this migration (previous: ${prev.filename})`,
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
