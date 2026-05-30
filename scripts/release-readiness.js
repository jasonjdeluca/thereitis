#!/usr/bin/env node
// release-readiness.js — aggregates all report files into a single go/no-go posture.
// Reads: company-readiness.json, content-validation.json, migration-check.json,
//        transcript-freshness.json (optional), playwright-results.json (optional).
// Output: reports/release-readiness.json
// Posture: "green" (ready) | "yellow" (minor issues) | "red" (blocker present)

import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "../reports");
const STALE_HOURS = 25; // reports older than this are flagged as stale

function loadReport(filepath) {
  if (!existsSync(filepath)) return null;
  try {
    const stat = statSync(filepath);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    const parsed = JSON.parse(readFileSync(filepath, "utf8"));
    parsed._age_hours = Math.round(ageHours);
    parsed._stale = ageHours > STALE_HOURS;
    return parsed;
  } catch {
    return null;
  }
}

function run() {
  const cr = loadReport(join(REPORTS_DIR, "company-readiness.json"));
  const cv = loadReport(join(REPORTS_DIR, "content-validation.json"));
  const mc = loadReport(join(REPORTS_DIR, "migration-check.json"));
  const tf = loadReport(join(REPORTS_DIR, "transcript-freshness.json"));
  const pw = loadReport(join(REPORTS_DIR, "playwright-results.json"));

  const blockers = [];
  const warnings = [];
  const info = [];

  // ── Report availability ────────────────────────────────────────────────────
  for (const [name, report] of [["company-readiness", cr], ["content-validation", cv], ["migration-check", mc]]) {
    if (!report) {
      blockers.push({ source: name, type: "report_missing", detail: `${name}.json not found — run cron scripts first` });
    } else if (report._stale) {
      warnings.push({ source: name, type: "report_stale", detail: `${name}.json is ${report._age_hours}h old` });
    }
  }

  // ── Company readiness ──────────────────────────────────────────────────────
  if (cr && !cr._stale) {
    for (const company of (cr.companies || [])) {
      for (const issue of (company.issues || [])) {
        if (issue.severity === "critical") {
          blockers.push({ source: "company-readiness", company: company.name || company.id, type: issue.type, detail: issue.detail });
        } else if (issue.severity === "warning") {
          warnings.push({ source: "company-readiness", company: company.name || company.id, type: issue.type, detail: issue.detail });
        }
      }
    }
  }

  // ── Content validation ─────────────────────────────────────────────────────
  if (cv && !cv._stale) {
    for (const flag of (cv.flags || [])) {
      if (flag.severity === "critical") {
        blockers.push({ source: "content-validation", company: flag.company_id, type: flag.type, detail: flag.content });
      }
    }
    // Phrase count per generated pack
    for (const pack of (cv.generated_packs || [])) {
      if (pack.issues_critical > 0) {
        blockers.push({ source: "content-validation-packs", company: pack.ticker, type: "generated_pack_critical", detail: `${pack.issues_critical} critical issue(s) in generated pack` });
      }
    }
  }

  // ── Migration check ────────────────────────────────────────────────────────
  if (mc && !mc._stale) {
    for (const issue of (mc.issues || [])) {
      if (["invalid_filename", "duplicate_timestamp"].includes(issue.type)) {
        blockers.push({ source: "migration-check", type: issue.type, detail: `${issue.filename}: ${issue.detail}` });
      } else {
        warnings.push({ source: "migration-check", type: issue.type, detail: `${issue.filename}: ${issue.detail}` });
      }
    }
  }

  // ── Transcript freshness ───────────────────────────────────────────────────
  if (tf && !tf._stale) {
    for (const flag of (tf.critical_flags || [])) {
      blockers.push({ source: "transcript-freshness", company: flag.company, type: flag.type, detail: flag.detail });
    }
    for (const flag of (tf.warnings || [])) {
      warnings.push({ source: "transcript-freshness", company: flag.company, type: flag.type, detail: flag.detail });
    }
  }

  // ── Playwright results ─────────────────────────────────────────────────────
  let smokeTestsPassed = null;
  let smokeTestsFailed = 0;
  if (pw) {
    const suites = pw.suites || [];
    const allTests = suites.flatMap((s) => s.specs || []).flatMap((sp) => sp.tests || []);
    const failed = allTests.filter((t) => t.status === "failed" || t.status === "unexpected");
    smokeTestsPassed = failed.length === 0;
    smokeTestsFailed = failed.length;
    if (!smokeTestsPassed) {
      blockers.push({
        source: "playwright",
        type: "smoke_test_failure",
        detail: `${smokeTestsFailed} smoke test(s) failed — the live site may be broken`,
      });
    }
  } else {
    warnings.push({ source: "playwright", type: "tests_not_run", detail: "playwright-results.json not found — smoke tests have not been run against this build" });
  }

  // ── Activation readiness: at least one active company ─────────────────────
  const activeWithPhrases = (cr?.companies || []).filter((c) => c.is_active && c.phrase_count >= 50);
  if (activeWithPhrases.length === 0) {
    blockers.push({ source: "launch-gate", type: "no_active_company", detail: "No active company has ≥50 phrases — the game cannot be played" });
  } else {
    info.push({ source: "launch-gate", type: "active_companies", detail: `${activeWithPhrases.length} active company(ies) with ≥50 phrases: ${activeWithPhrases.map((c) => c.name || c.id).join(", ")}` });
  }

  // ── Posture ────────────────────────────────────────────────────────────────
  const posture = blockers.length > 0 ? "red" : warnings.length > 0 ? "yellow" : "green";
  const ready_to_launch = posture === "green";

  const report = {
    generated_at: new Date().toISOString(),
    posture,
    ready_to_launch,
    summary: {
      blockers: blockers.length,
      warnings: warnings.length,
      active_companies_ready: activeWithPhrases.length,
      smoke_tests_passed: smokeTestsPassed,
    },
    blockers,
    warnings,
    info,
    reports_used: {
      company_readiness: cr ? { age_hours: cr._age_hours, stale: cr._stale } : null,
      content_validation: cv ? { age_hours: cv._age_hours, stale: cv._stale } : null,
      migration_check: mc ? { age_hours: mc._age_hours, stale: mc._stale } : null,
      transcript_freshness: tf ? { age_hours: tf._age_hours, stale: tf._stale } : null,
      playwright_results: pw ? { smoke_tests_failed: smokeTestsFailed } : null,
    },
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "release-readiness.json"), JSON.stringify(report, null, 2));

  const icon = posture === "green" ? "✅" : posture === "yellow" ? "⚠️" : "🔴";
  console.log(`release-readiness: ${icon} ${posture.toUpperCase()} — ${blockers.length} blocker(s), ${warnings.length} warning(s)`);

  if (posture === "red") process.exit(1);
}

try {
  run();
} catch (err) {
  console.error("FATAL:", err.message);
  process.exit(1);
}
