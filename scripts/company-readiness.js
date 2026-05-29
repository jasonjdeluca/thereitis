#!/usr/bin/env node
// company-readiness.js — checks every company row for phrase count, trivia count,
// active-with-zero-phrases, phrase length violations, and missing metadata.
// Output: reports/company-readiness.json

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

async function run() {
  // Fetch all companies
  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("id, name, is_active, emoji, call_identifier, next_earnings_date");
  if (compErr) {
    console.error("ERROR fetching companies:", compErr.message);
    process.exit(1);
  }

  // Fetch phrase counts and phrases per company
  const { data: phrases, error: phraseErr } = await supabase
    .from("phrases")
    .select("id, company_id, phrase, is_active");
  if (phraseErr) {
    console.error("ERROR fetching phrases:", phraseErr.message);
    process.exit(1);
  }

  // Fetch trivia counts per company
  const { data: trivia, error: triviaErr } = await supabase
    .from("trivia_questions")
    .select("id, company_id, is_active");
  if (triviaErr) {
    console.error("ERROR fetching trivia:", triviaErr.message);
    process.exit(1);
  }

  // Build lookup maps
  const phrasesByCompany = {};
  for (const p of phrases) {
    if (!phrasesByCompany[p.company_id]) phrasesByCompany[p.company_id] = [];
    phrasesByCompany[p.company_id].push(p);
  }

  const triviaCountByCompany = {};
  for (const t of trivia) {
    triviaCountByCompany[t.company_id] = (triviaCountByCompany[t.company_id] || 0) + 1;
  }

  let critical_count = 0;
  let warning_count = 0;
  const companyResults = [];

  for (const company of companies) {
    const compPhrases = phrasesByCompany[company.id] || [];
    const phrase_count = compPhrases.length;
    const trivia_count = triviaCountByCompany[company.id] || 0;
    const issues = [];

    // Critical: active with zero phrases
    if (company.is_active && phrase_count === 0) {
      issues.push({ severity: "critical", type: "active_zero_phrases", detail: "Company is active but has no phrases" });
    }

    // Flag phrases over 25 characters
    for (const p of compPhrases) {
      if (p.phrase && p.phrase.length > 25) {
        issues.push({ severity: "critical", type: "phrase_too_long", detail: `Phrase exceeds 25 chars: "${p.phrase}"` });
      }
    }

    // Missing required metadata
    if (!company.emoji) {
      issues.push({ severity: "critical", type: "missing_emoji", detail: "Missing emoji" });
    }
    if (!company.name) {
      issues.push({ severity: "critical", type: "missing_name", detail: "Missing name" });
    }

    // Missing next_call_date (next_earnings_date)
    if (!company.next_earnings_date) {
      issues.push({ severity: "warning", type: "missing_next_call_date", detail: "Missing next_earnings_date" });
    }

    // Missing ticker — companies table has id which serves as ticker; flag if id looks non-standard
    // (id is the canonical ticker-like key; check call_identifier as a proxy for whether data is populated)
    if (!company.call_identifier) {
      issues.push({ severity: "warning", type: "missing_call_identifier", detail: "Missing call_identifier" });
    }

    const hasCritical = issues.some(i => i.severity === "critical");
    const hasWarning = issues.some(i => i.severity === "warning");
    if (hasCritical) critical_count++;
    else if (hasWarning) warning_count++;

    companyResults.push({
      id: company.id,
      name: company.name,
      is_active: company.is_active,
      phrase_count,
      trivia_count,
      issues,
    });
  }

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      total_companies: companies.length,
      active_companies: companies.filter(c => c.is_active).length,
      critical_count,
      warning_count,
    },
    companies: companyResults,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "company-readiness.json"), JSON.stringify(report, null, 2));
  console.log(`company-readiness: ${companies.length} companies, ${critical_count} critical, ${warning_count} warnings`);
}

run().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
