#!/usr/bin/env node
// content-validation.js — validates phrases and trivia for content quality issues.
// Part A — DB checks: queries Supabase phrases and trivia_questions tables.
// Part B — generated pack checks: scans company-packs/{ticker}/generated/ on disk.
// Outputs: reports/content-validation.json
//          company-packs/{ticker}/generated/validation_report.json (per pack, if generated/)

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "../reports");
const PACKS_DIR = join(__dirname, "../company-packs");

const MAX_PHRASE_CHARS = 25;
const MAX_TRIVIA_ANSWER_CHARS = 80;
const MIN_PHRASES_READY = 50;
const MIN_TRIVIA_READY = 12;

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

// ── Part B: generated pack checks ─────────────────────────────────────────────

function validateGeneratedPack(ticker) {
  const packDir = join(PACKS_DIR, ticker, "generated");
  const phrasesPath = join(packDir, "phrases.json");
  const triviaPath = join(packDir, "trivia.json");
  const reportPath = join(packDir, "validation_report.json");

  const issues = [];

  // ── Phrases ──────────────────────────────────────────────────────────────────
  let phrases = [];
  if (!existsSync(phrasesPath)) {
    issues.push({ type: "missing_file", file: "phrases.json", severity: "critical" });
  } else {
    try {
      phrases = JSON.parse(readFileSync(phrasesPath, "utf8"));
    } catch (e) {
      issues.push({ type: "parse_error", file: "phrases.json", detail: e.message, severity: "critical" });
    }
  }

  const seenPhrases = new Set();
  for (const phrase of phrases) {
    if (typeof phrase !== "string") {
      issues.push({ type: "non_string_phrase", content: String(phrase), severity: "critical" });
      continue;
    }
    const p = phrase.trim();
    if (!p) {
      issues.push({ type: "blank_phrase", severity: "critical" });
      continue;
    }
    if (p.length > MAX_PHRASE_CHARS) {
      issues.push({ type: "phrase_too_long", content: p, detail: `${p.length} chars`, severity: "critical" });
    }
    const nameMatch = looksLikePersonName(p);
    if (nameMatch) {
      issues.push({ type: "possible_person_name", content: p, detail: nameMatch, severity: "review" });
    }
    const key = p.toLowerCase();
    if (seenPhrases.has(key)) {
      issues.push({ type: "duplicate_phrase", content: p, severity: "warning" });
    }
    seenPhrases.add(key);
  }

  // ── Trivia ───────────────────────────────────────────────────────────────────
  let trivia = [];
  if (!existsSync(triviaPath)) {
    issues.push({ type: "missing_file", file: "trivia.json", severity: "critical" });
  } else {
    try {
      trivia = JSON.parse(readFileSync(triviaPath, "utf8"));
    } catch (e) {
      issues.push({ type: "parse_error", file: "trivia.json", detail: e.message, severity: "critical" });
    }
  }

  for (const q of trivia) {
    const requiredFields = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer"];
    const missing = requiredFields.filter(k => !q[k]);
    if (missing.length) {
      issues.push({ type: "trivia_missing_fields", content: q.question || "(no question)", detail: missing.join(", "), severity: "critical" });
      continue;
    }
    if (!["a", "b", "c", "d"].includes(q.correct_answer)) {
      issues.push({ type: "trivia_invalid_answer", content: q.question, detail: `correct_answer="${q.correct_answer}"`, severity: "critical" });
    }
    const answers = [q.option_a, q.option_b, q.option_c, q.option_d];
    for (const ans of answers) {
      if (ans.length > MAX_TRIVIA_ANSWER_CHARS) {
        issues.push({ type: "trivia_answer_too_long", content: q.question, detail: `"${ans.slice(0, 40)}…" (${ans.length} chars)`, severity: "warning" });
      }
    }
    const allText = [q.question, q.option_a, q.option_b, q.option_c, q.option_d].join(" ");
    const nameMatch = looksLikePersonName(allText);
    if (nameMatch) {
      issues.push({ type: "trivia_possible_person_name", content: q.question, detail: nameMatch, severity: "review" });
    }
  }

  // ── Readiness assessment ──────────────────────────────────────────────────────
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const phraseReadiness = phrases.length >= MIN_PHRASES_READY ? "ready" : phrases.length >= 25 ? "below_target" : "insufficient";
  const triviaReadiness = trivia.length >= MIN_TRIVIA_READY ? "ready" : "insufficient";
  const ready = criticalCount === 0 && phraseReadiness === "ready" && triviaReadiness === "ready";

  const result = {
    ticker,
    validated_at: new Date().toISOString(),
    phrase_count: phrases.length,
    trivia_count: trivia.length,
    issues_critical: criticalCount,
    issues_review: issues.filter(i => i.severity === "review").length,
    issues_warning: issues.filter(i => i.severity === "warning").length,
    phrase_readiness: phraseReadiness,
    trivia_readiness: triviaReadiness,
    ready_for_migration: ready,
    issues,
  };

  // Merge into the existing ops-worker validation_report.json if present
  if (existsSync(reportPath)) {
    try {
      const existing = JSON.parse(readFileSync(reportPath, "utf8"));
      const merged = { ...existing, content_qa: result };
      writeFileSync(reportPath, JSON.stringify(merged, null, 2));
    } catch {
      writeFileSync(reportPath, JSON.stringify({ content_qa: result }, null, 2));
    }
  } else {
    writeFileSync(reportPath, JSON.stringify({ content_qa: result }, null, 2));
  }

  return result;
}

function scanGeneratedPacks() {
  if (!existsSync(PACKS_DIR)) return [];
  const results = [];
  const tickers = readdirSync(PACKS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  for (const ticker of tickers) {
    const genDir = join(PACKS_DIR, ticker, "generated");
    if (existsSync(genDir)) {
      results.push(validateGeneratedPack(ticker));
    }
  }
  return results;
}

// ── Part A: DB checks ──────────────────────────────────────────────────────────

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

  // Part B: scan generated packs on disk
  const packResults = scanGeneratedPacks();
  const packsReadyCount = packResults.filter(r => r.ready_for_migration).length;
  const packsWithCritical = packResults.filter(r => r.issues_critical > 0).map(r => r.ticker);

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      total_phrases: phrases.length,
      flagged_count: flags.filter(f => f.type !== "trivia_invalid").length,
      trivia_flagged_count,
      generated_packs_scanned: packResults.length,
      generated_packs_ready: packsReadyCount,
      generated_packs_with_critical_issues: packsWithCritical,
    },
    flags,
    generated_packs: packResults,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, "content-validation.json"), JSON.stringify(report, null, 2));
  console.log(
    `content-validation: ${phrases.length} DB phrases, ${flags.length} DB flags (${trivia_flagged_count} trivia);` +
    ` ${packResults.length} generated packs scanned, ${packsReadyCount} ready`
  );
}

run().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
