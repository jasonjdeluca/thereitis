#!/usr/bin/env node
// content-validation.js — validates all phrases and trivia for content quality issues.
// Checks: over-length phrases, blank phrases, cross-company duplicates, possible person
// names (two consecutive Title-Case words), trivia missing choices or correct_answer.
// Output: reports/content-validation.json

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

// Common Title-Case words that are NOT person names.
// Two consecutive Title-Case words not in this list are flagged for review.
const ALLOWED_TITLE_WORDS = new Set([
  "Serial", "Compounder", "Brand", "Led", "Network", "Driven", "Platform",
  "Enabled", "Flywheel", "Never", "Say", "Long", "Time", "Early", "Days",
  "Effect", "White", "Space", "Shots", "Goal", "Green", "Shoots",
  "C-Shaped", "Economy", "Above", "Algorithm", "Commercial", "Engine",
  "Conversion", "Rate", "Great", "Question", "Sneak", "One", "More", "In",
  "Unpack", "That", "Flow", "Through", "Rule", "Of", "Thumb", "In-Year",
  "For-Year", "Return", "Capital", "Asset", "Light", "Chain", "Scales",
  "War", "Is", "AI", "Complex", "Productivity", "Boom", "Middle", "Class",
  "Macro", "Tailwinds", "APAC", "Ex", "China", "Business", "Transient",
  "Leisure", "Group", "Leading", "Development", "Outlook", "Organic",
  "Growth", "Tech", "Stack", "Deregulation", "Margin", "Expansion",
  "Fee", "Loyalty", "Mix", "Owned", "And", "Leased", "Gonculator",
  "Unforeseen", "Circumstances", "I've", "Been", "Consistent", "Acquirer",
  "Psychic", "Filibuster", "K", "Don't", "Overcook", "It", "The", "A",
  "An", "To", "At", "By", "For", "With", "From", "We", "Our", "This",
  "Their", "Its", "All", "New", "Next", "First", "Last", "Full", "Year",
  "Quarter", "Q1", "Q2", "Q3", "Q4", "CEO", "CFO", "COO", "CTO",
  "Global", "International", "North", "South", "East", "West", "American",
  "Total", "Core", "Key", "Strong", "High", "Low", "Net", "Gross",
  "Free", "Cash", "Flow", "Debt", "Equity", "Market", "Share",
  "Cost", "Revenue", "Margin", "Profit", "Loss", "Earnings", "Call",
  "Drive", "Driving", "Build", "Building", "Create", "Creating",
  "Deliver", "Delivering", "Position", "Positioned", "Continue",
  "Continued", "Accelerate", "Accelerating", "Invest", "Investing",
  "Customer", "Consumer", "Partner", "Partnership", "Strategy", "Strategic",
  "Value", "Creation", "Long-Term", "Short-Term", "Term",
]);

function looksLikePersonName(phrase) {
  // Looks for two consecutive words where both start with a capital letter
  // and neither is in the allowed list. Heuristic — flag for human review only.
  const words = phrase.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i].replace(/[^A-Za-z'-]/g, "");
    const w2 = words[i + 1].replace(/[^A-Za-z'-]/g, "");
    if (
      w1.length > 1 && w2.length > 1 &&
      /^[A-Z]/.test(w1) && /^[A-Z]/.test(w2) &&
      !ALLOWED_TITLE_WORDS.has(w1) && !ALLOWED_TITLE_WORDS.has(w2)
    ) {
      return `"${w1} ${w2}"`;
    }
  }
  return null;
}

async function run() {
  const { data: phrases, error: phraseErr } = await supabase
    .from("phrases")
    .select("id, company_id, phrase");
  if (phraseErr) {
    console.error("ERROR fetching phrases:", phraseErr.message);
    process.exit(1);
  }

  const { data: trivia, error: triviaErr } = await supabase
    .from("trivia_questions")
    .select("id, company_id, question, option_a, option_b, option_c, option_d, correct_answer");
  if (triviaErr) {
    console.error("ERROR fetching trivia:", triviaErr.message);
    process.exit(1);
  }

  const flags = [];

  // Track phrase text → company_ids for duplicate detection
  const phraseIndex = {};

  for (const p of phrases) {
    const text = p.phrase;

    // Blank or whitespace-only
    if (!text || !text.trim()) {
      flags.push({ type: "blank_phrase", company_id: p.company_id, content: "(blank)", severity: "critical" });
      continue;
    }

    // Over 25 characters
    if (text.length > 25) {
      flags.push({ type: "phrase_too_long", company_id: p.company_id, content: text, severity: "critical" });
    }

    // Possible person name
    const nameMatch = looksLikePersonName(text);
    if (nameMatch) {
      flags.push({ type: "possible_person_name", company_id: p.company_id, content: text, detail: `Possible person name: ${nameMatch}`, severity: "review" });
    }

    // Track for cross-company duplicate check
    const key = text.toLowerCase().trim();
    if (!phraseIndex[key]) phraseIndex[key] = [];
    phraseIndex[key].push(p.company_id);
  }

  // Cross-company duplicates — same phrase text in more than one company
  for (const [key, companyIds] of Object.entries(phraseIndex)) {
    const unique = [...new Set(companyIds)];
    if (unique.length > 1) {
      flags.push({
        type: "cross_company_duplicate",
        company_id: unique.join(", "),
        content: key,
        detail: `Phrase appears in companies: ${unique.join(", ")}`,
        severity: "warning",
      });
    }
  }

  // Trivia checks
  let trivia_flagged_count = 0;
  for (const t of trivia) {
    const hasChoices = t.option_a && t.option_b && t.option_c && t.option_d;
    const hasAnswer = t.correct_answer && ["a", "b", "c", "d"].includes(t.correct_answer);
    if (!hasChoices || !hasAnswer) {
      trivia_flagged_count++;
      flags.push({
        type: "trivia_invalid",
        company_id: t.company_id,
        content: t.question || "(no question)",
        detail: !hasChoices ? "Missing one or more answer choices" : "Missing or invalid correct_answer",
        severity: "critical",
      });
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      total_phrases: phrases.length,
      flagged_count: flags.filter(f => f.type !== "trivia_invalid").length,
      trivia_flagged_count,
    },
    flags,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "content-validation.json"), JSON.stringify(report, null, 2));
  console.log(`content-validation: ${phrases.length} phrases, ${flags.length} flags (${trivia_flagged_count} trivia)`);
}

run().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
