#!/usr/bin/env node
// transcript-freshness.js — checks transcript coverage health for every company.
// Flags: never ingested, stale coverage (2+ quarters behind), earnings approaching
// within 14 days without a fresh transcript, post-call transcript needed (call date
// passed 0-10 days ago and latest_ingested_quarter not updated).
// Output: reports/transcript-freshness.json

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "../reports");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APPROACHING_DAYS = 14;   // flag if earnings within this many days
const POST_CALL_DAYS = 10;     // flag if earnings passed this recently without new transcript
const STALE_QUARTERS = 3;      // quarters_behind threshold for "stale"
const APPROACHING_STALE_QUARTERS = 2; // quarters_behind threshold for "approaching_stale"

// Parse "Q1 2026" → Date representing end of that calendar quarter.
function parseQuarterEnd(quarterStr) {
  if (!quarterStr) return null;
  const m = quarterStr.match(/^Q([1-4])\s+(\d{4})$/);
  if (!m) return null;
  const q = parseInt(m[1]);
  const year = parseInt(m[2]);
  // Month index (0-based) of last day of each quarter
  const ends = { 1: [2, 31], 2: [5, 30], 3: [8, 30], 4: [11, 31] };
  const [month, day] = ends[q];
  return new Date(year, month, day);
}

// Count how many complete calendar quarters have elapsed since a given date.
function quartersElapsed(fromDate) {
  const now = new Date();
  const years = now.getFullYear() - fromDate.getFullYear();
  const months = now.getMonth() - fromDate.getMonth();
  const totalMonths = years * 12 + months;
  return Math.max(0, Math.floor(totalMonths / 3));
}

// Days between two dates (positive = date is in the future, negative = past).
function daysUntil(date) {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function assessCompany(company) {
  const {
    id, name, is_active,
    latest_ingested_quarter,
    next_earnings_date,
  } = company;

  const flags = [];
  let quarters_behind = null;
  let staleness = "unknown";

  // Freshness assessment
  const quarterEnd = parseQuarterEnd(latest_ingested_quarter);
  if (!latest_ingested_quarter) {
    flags.push({ type: "never_ingested", severity: "critical", detail: "No transcript has been ingested for this company." });
    staleness = "never_ingested";
  } else if (!quarterEnd) {
    flags.push({ type: "unparseable_quarter", severity: "warning", detail: `Cannot parse latest_ingested_quarter value: "${latest_ingested_quarter}"` });
    staleness = "unparseable";
  } else {
    quarters_behind = quartersElapsed(quarterEnd);
    if (quarters_behind >= STALE_QUARTERS) {
      staleness = "stale";
      flags.push({
        type: "stale_coverage",
        severity: "critical",
        detail: `${quarters_behind} calendar quarters since last ingestion (${latest_ingested_quarter}). Exceeds ${STALE_QUARTERS}-quarter threshold.`,
      });
    } else if (quarters_behind >= APPROACHING_STALE_QUARTERS) {
      staleness = "approaching_stale";
      flags.push({
        type: "approaching_stale",
        severity: "warning",
        detail: `${quarters_behind} quarters since last ingestion (${latest_ingested_quarter}). Approaching stale threshold.`,
      });
    } else {
      staleness = "fresh";
    }
  }

  // Earnings date assessments
  if (next_earnings_date) {
    const earningsDate = new Date(next_earnings_date);
    const daysAway = daysUntil(earningsDate);

    if (daysAway >= 0 && daysAway <= APPROACHING_DAYS) {
      flags.push({
        type: "earnings_approaching",
        severity: staleness === "fresh" ? "info" : "warning",
        detail: `Earnings call in ${daysAway} day(s) (${earningsDate.toDateString()}). Confirm transcript is ready post-call.`,
      });
    }

    if (daysAway < 0 && daysAway >= -POST_CALL_DAYS) {
      const daysPast = Math.abs(daysAway);
      // Flag if latest_ingested_quarter is still pointing to the pre-call quarter
      // (i.e., it hasn't been updated since the call date passed)
      // We can't be certain without knowing the expected new quarter, so flag
      // any company where call date passed and staleness is not "fresh".
      if (staleness !== "fresh" || !latest_ingested_quarter) {
        flags.push({
          type: "post_call_transcript_needed",
          severity: "critical",
          detail: `Earnings call was ${daysPast} day(s) ago (${earningsDate.toDateString()}). Transcript ingestion likely needed. Manual HTTP check on IR page required.`,
        });
      }
    }
  } else if (is_active) {
    flags.push({
      type: "missing_next_earnings_date",
      severity: "warning",
      detail: "Active company has no next_earnings_date set. Cannot assess upcoming transcript needs.",
    });
  }

  return {
    company_id: id,
    company_name: name,
    is_active,
    latest_ingested_quarter: latest_ingested_quarter || null,
    quarters_behind,
    staleness,
    next_earnings_date: next_earnings_date || null,
    flags,
  };
}

async function run() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, is_active, latest_ingested_quarter, next_earnings_date")
    .order("name");

  if (error) {
    console.error("ERROR fetching companies:", error.message);
    process.exit(1);
  }

  const results = companies.map(assessCompany);

  const critical = results.flatMap(r => r.flags.filter(f => f.severity === "critical").map(f => ({ company: r.company_name, ...f })));
  const warnings = results.flatMap(r => r.flags.filter(f => f.severity === "warning").map(f => ({ company: r.company_name, ...f })));
  const info = results.flatMap(r => r.flags.filter(f => f.severity === "info").map(f => ({ company: r.company_name, ...f })));

  const staleCompanies = results.filter(r => r.staleness === "stale").map(r => r.company_name);
  const approachingStale = results.filter(r => r.staleness === "approaching_stale").map(r => r.company_name);
  const neverIngested = results.filter(r => r.staleness === "never_ingested" && r.is_active).map(r => r.company_name);
  const earningsApproaching = results.filter(r => r.flags.some(f => f.type === "earnings_approaching")).map(r => r.company_name);
  const postCallNeeded = results.filter(r => r.flags.some(f => f.type === "post_call_transcript_needed")).map(r => r.company_name);

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      total_companies: companies.length,
      active_companies: companies.filter(c => c.is_active).length,
      stale_count: staleCompanies.length,
      approaching_stale_count: approachingStale.length,
      never_ingested_active_count: neverIngested.length,
      earnings_approaching_count: earningsApproaching.length,
      post_call_transcript_needed_count: postCallNeeded.length,
      critical_issue_count: critical.length,
      warning_count: warnings.length,
    },
    attention_required: {
      stale_companies: staleCompanies,
      approaching_stale: approachingStale,
      active_never_ingested: neverIngested,
      earnings_approaching_14d: earningsApproaching,
      post_call_transcript_needed: postCallNeeded,
    },
    critical_flags: critical,
    warnings,
    info,
    companies: results,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "transcript-freshness.json"), JSON.stringify(report, null, 2));

  console.log(
    `transcript-freshness: ${companies.length} companies — ` +
    `${staleCompanies.length} stale, ${approachingStale.length} approaching, ` +
    `${neverIngested.length} active-never-ingested, ` +
    `${earningsApproaching.length} earnings approaching, ` +
    `${postCallNeeded.length} post-call transcript needed`
  );

  if (critical.length > 0) {
    process.exit(1); // non-zero so cron can detect critical issues
  }
}

run().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
