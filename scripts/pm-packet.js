#!/usr/bin/env node
// pm-packet.js — aggregates the three truth-layer reports into a single AI-readable
// summary packet. Exits with an error if any report is missing or older than 2 hours.
// Output: reports/pm-packet.json

import { readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "../reports");
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const REPORT_FILES = {
  company_readiness: join(REPORTS_DIR, "company-readiness.json"),
  content_validation: join(REPORTS_DIR, "content-validation.json"),
  migration_check: join(REPORTS_DIR, "migration-check.json"),
};

// Optional reports — included if present and fresh; silently skipped otherwise.
const OPTIONAL_REPORT_FILES = {
  transcript_freshness: join(REPORTS_DIR, "transcript-freshness.json"),
};

function loadReport(key, filepath) {
  let stat;
  try {
    stat = statSync(filepath);
  } catch {
    console.error(`ERROR: Report missing: ${filepath}`);
    process.exit(1);
  }

  const ageMs = Date.now() - stat.mtimeMs;
  if (ageMs > TWO_HOURS_MS) {
    const ageMin = Math.round(ageMs / 60000);
    console.error(`ERROR: Report too old (${ageMin} min): ${filepath}`);
    process.exit(1);
  }

  try {
    return JSON.parse(readFileSync(filepath, "utf8"));
  } catch (err) {
    console.error(`ERROR: Cannot parse ${filepath}: ${err.message}`);
    process.exit(1);
  }
}

function loadOptionalReport(filepath) {
  try {
    const stat = statSync(filepath);
    if (Date.now() - stat.mtimeMs > TWO_HOURS_MS) return null;
    return JSON.parse(readFileSync(filepath, "utf8"));
  } catch {
    return null;
  }
}

async function writeHeartbeat(details) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.warn("[heartbeat] SUPABASE_SERVICE_ROLE_KEY not set — skipping heartbeat write");
      return;
    }

    const serviceSupabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      serviceRoleKey,
      { auth: { persistSession: false } },
    );
    const { error } = await serviceSupabase.from("system_health").upsert({
      id: 1,
      last_heartbeat_at: new Date().toISOString(),
      source: "cron:pm-packet",
      details,
    });
    if (error) throw error;
  } catch (err) {
    console.warn(`WARNING: Could not write system health heartbeat: ${err.message}`);
  }
}

async function run() {
  const cr = loadReport("company_readiness", REPORT_FILES.company_readiness);
  const cv = loadReport("content_validation", REPORT_FILES.content_validation);
  const mc = loadReport("migration_check", REPORT_FILES.migration_check);
  const tf = loadOptionalReport(OPTIONAL_REPORT_FILES.transcript_freshness);

  const critical_issues = [];
  const warnings = [];
  const healthy_companies = [];
  const companies_below_50_phrases = [];

  // Collect critical issues from company-readiness
  for (const company of (cr.companies || [])) {
    for (const issue of (company.issues || [])) {
      if (issue.severity === "critical") {
        critical_issues.push({
          source: "company-readiness",
          company_id: company.id,
          company_name: company.name,
          type: issue.type,
          detail: issue.detail,
        });
      } else if (issue.severity === "warning") {
        warnings.push({
          source: "company-readiness",
          company_id: company.id,
          company_name: company.name,
          type: issue.type,
          detail: issue.detail,
        });
      }
    }

    const hasNoCritical = !(company.issues || []).some(i => i.severity === "critical");
    const hasNoWarning = !(company.issues || []).some(i => i.severity === "warning");
    if (hasNoCritical && hasNoWarning && company.phrase_count > 0) {
      healthy_companies.push({ id: company.id, name: company.name, phrase_count: company.phrase_count });
    }

    if (company.phrase_count < 50) {
      companies_below_50_phrases.push({ id: company.id, name: company.name, phrase_count: company.phrase_count });
    }
  }

  // Collect critical flags from content-validation
  for (const flag of (cv.flags || [])) {
    if (flag.severity === "critical") {
      critical_issues.push({
        source: "content-validation",
        company_id: flag.company_id,
        type: flag.type,
        detail: flag.content,
      });
    } else if (flag.severity === "warning") {
      warnings.push({
        source: "content-validation",
        company_id: flag.company_id,
        type: flag.type,
        detail: flag.content,
      });
    }
  }

  // Transcript freshness issues (optional)
  if (tf) {
    for (const flag of (tf.critical_flags || [])) {
      critical_issues.push({
        source: "transcript-freshness",
        company_name: flag.company,
        type: flag.type,
        detail: flag.detail,
      });
    }
    for (const flag of (tf.warnings || [])) {
      warnings.push({
        source: "transcript-freshness",
        company_name: flag.company,
        type: flag.type,
        detail: flag.detail,
      });
    }
  }

  // Migration issues
  for (const issue of (mc.issues || [])) {
    const entry = { source: "migration-check", type: issue.type, detail: `${issue.filename}: ${issue.detail}` };
    if (issue.type === "invalid_filename" || issue.type === "duplicate_timestamp") {
      critical_issues.push(entry);
    } else {
      warnings.push(entry);
    }
  }

  // Derive recommended_focus
  let recommended_focus = "All systems look healthy — no critical issues detected.";
  if (critical_issues.length > 0) {
    const activeZero = critical_issues.find(i => i.type === "active_zero_phrases");
    const tooLong = critical_issues.find(i => i.type === "phrase_too_long");
    const triviaInvalid = critical_issues.find(i => i.type === "trivia_invalid");
    const stale = critical_issues.find(i => i.source === "transcript-freshness" && i.type === "stale_coverage");
    const postCall = critical_issues.find(i => i.source === "transcript-freshness" && i.type === "post_call_transcript_needed");
    if (activeZero) {
      recommended_focus = `Deactivate or populate "${activeZero.company_name || activeZero.company_id}" immediately — it is active with zero phrases and will silently fail for players.`;
    } else if (postCall) {
      recommended_focus = `Earnings call has passed for "${postCall.company_name}" — locate and ingest the new transcript before the next session.`;
    } else if (tooLong) {
      recommended_focus = `Fix phrase length violations for company "${tooLong.company_id}" — at least one phrase exceeds the 25-character DB constraint and will break ingestion.`;
    } else if (triviaInvalid) {
      recommended_focus = `Fix ${cv.summary?.trivia_flagged_count || "one or more"} trivia questions missing choices or a correct_answer field — they will cause errors during gameplay.`;
    } else if (stale) {
      recommended_focus = `Transcript coverage is stale for "${stale.company_name}" — run ingestion to refresh content before players notice outdated phrases.`;
    } else {
      recommended_focus = `Resolve ${critical_issues.length} critical issue(s) before the next run — see critical_issues for details.`;
    }
  } else if (companies_below_50_phrases.length > 0) {
    const worst = companies_below_50_phrases.sort((a, b) => a.phrase_count - b.phrase_count)[0];
    recommended_focus = `Ingest phrases for "${worst.name || worst.id}" (currently ${worst.phrase_count} phrases) to reach the 50-phrase minimum required for activation.`;
  } else if (warnings.length > 0) {
    recommended_focus = `Address ${warnings.length} warning(s) — most are missing metadata (next_earnings_date, call_identifier) that affects countdown timers and the admin console.`;
  }

  const report = {
    generated_at: new Date().toISOString(),
    reports_read_at: {
      company_readiness: cr.generated_at,
      content_validation: cv.generated_at,
      migration_check: mc.generated_at,
      transcript_freshness: tf?.generated_at || null,
    },
    critical_issues,
    warnings,
    healthy_companies,
    companies_below_50_phrases,
    recommended_focus,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "pm-packet.json"), JSON.stringify(report, null, 2));
  console.log(`pm-packet: ${critical_issues.length} critical, ${warnings.length} warnings, ${healthy_companies.length} healthy companies`);
  await writeHeartbeat({ reports_written: 1 });
}

run().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
