#!/usr/bin/env node
// extractor.js — Stage 2.
// Reads fetched transcripts, generates 2–5 word candidate phrases via n-gram
// extraction, scores them by frequency + business-term boost, flags possible
// person names, and writes them into the candidates table.

import { fileURLToPath } from "url";
import path from "path";
import { readFileSync } from "fs";
import {
  getDb,
  log,
  logError,
  STOPWORDS,
  BOOST_TERMS,
  ALLOWED_PROPER_NOUNS,
} from "./lib/common.js";

const MAX_PHRASE_CHARS = 25;
const NGRAM_SIZES = [2, 3, 4, 5];
const MIN_FREQUENCY = 2;

function tokenizeSentences(text) {
  // Split on sentence-ending punctuation followed by whitespace.
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wordsOf(sentence) {
  // Keep apostrophes/hyphens inside words; drop other punctuation.
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function isStopword(w) {
  return STOPWORDS.has(w);
}

function hasDigit(s) {
  return /\d/.test(s);
}

function keepCandidate(words) {
  const phrase = words.join(" ");
  if (phrase.length > MAX_PHRASE_CHARS) return false;
  if (hasDigit(phrase)) return false;
  // Not entirely stopwords; at least one non-stopword.
  if (words.every(isStopword)) return false;
  // Do not start or end with a stopword.
  if (isStopword(words[0]) || isStopword(words[words.length - 1])) return false;
  return true;
}

// Flag two consecutive title-cased words (in the original casing) that are not a
// known allowed proper noun — a lightweight person-name heuristic.
function flagPersonName(phrase, titleCasedPairs) {
  const lower = phrase.toLowerCase();
  if (ALLOWED_PROPER_NOUNS.has(lower)) return false;
  return titleCasedPairs.has(lower);
}

function collectTitleCasedPairs(rawText) {
  // Build a set of lowercased "word word" bigrams where both words were
  // title-cased in the source text (e.g. "Jamie Dimon" → "jamie dimon").
  const pairs = new Set();
  const sentences = rawText.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    // Skip the first token of each sentence — it is title-cased by grammar.
    const tokens = sentence.split(/\s+/).filter(Boolean);
    for (let i = 1; i < tokens.length - 1; i++) {
      const a = tokens[i].replace(/[^A-Za-z'-]/g, "");
      const b = tokens[i + 1].replace(/[^A-Za-z'-]/g, "");
      if (/^[A-Z][a-z'’-]+$/.test(a) && /^[A-Z][a-z'’-]+$/.test(b)) {
        pairs.add(`${a.toLowerCase()} ${b.toLowerCase()}`);
      }
    }
  }
  return pairs;
}

function normalize(text) {
  // Fold smart quotes to ASCII so contractions ("he's", "we're") survive as one
  // token instead of fragmenting into junk bigrams like "he s".
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\u00A0/g, " ");
}

function extractFromText(rawTextIn) {
  const rawText = normalize(rawTextIn);
  const lowerFull = rawText.toLowerCase();
  const sentences = tokenizeSentences(rawText);
  const titleCasedPairs = collectTitleCasedPairs(rawText);

  // 1. Gather unique candidate phrases from all n-grams.
  const candidateSet = new Set();
  for (const sentence of sentences) {
    const words = wordsOf(sentence);
    for (const n of NGRAM_SIZES) {
      for (let i = 0; i + n <= words.length; i++) {
        const slice = words.slice(i, i + n);
        if (keepCandidate(slice)) candidateSet.add(slice.join(" "));
      }
    }
  }

  // 2. Score by frequency across the full transcript (case-insensitive).
  const results = [];
  for (const phrase of candidateSet) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lowerFull.match(new RegExp(escaped, "g"));
    const frequency = matches ? matches.length : 0;
    if (frequency < MIN_FREQUENCY) continue;

    let score = frequency;
    if (BOOST_TERMS.some((t) => phrase.includes(t))) score += 1;

    const flags = [];
    if (flagPersonName(phrase, titleCasedPairs)) {
      flags.push("possible_person_name");
    }

    results.push({ phrase, frequency, score, flags });
  }

  return results;
}

export function runExtractor({ ticker = null } = {}) {
  const db = getDb();
  const filterTicker = ticker ? ticker.toUpperCase() : null;

  let query =
    "SELECT * FROM queue WHERE fetch_status = 'fetched' AND phrases_extracted = 0";
  const params = [];
  if (filterTicker) {
    query += " AND ticker = ?";
    params.push(filterTicker);
  }
  query += " ORDER BY id";

  const rows = db.prepare(query).all(...params);
  log(`Extractor starting — ${rows.length} transcript(s) to process.`);

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (queue_id, ticker, fiscal_quarter, phrase, frequency, nlp_score, nlp_flags)
    VALUES (@queue_id, @ticker, @fiscal_quarter, @phrase, @frequency, @nlp_score, @nlp_flags)
  `);
  const updateQueue = db.prepare(
    "UPDATE queue SET phrases_extracted = ?, updated_at = datetime('now') WHERE id = ?",
  );

  const perTicker = {};

  for (const row of rows) {
    let rawText;
    try {
      rawText = readFileSync(row.raw_text_path, "utf8");
    } catch (err) {
      logError(
        `  ✗ ${row.ticker} ${row.fiscal_quarter}: cannot read ${row.raw_text_path}: ${err.message}`,
      );
      continue;
    }

    const candidates = extractFromText(rawText);

    const insertMany = db.transaction((items) => {
      for (const c of items) {
        insertCandidate.run({
          queue_id: row.id,
          ticker: row.ticker,
          fiscal_quarter: row.fiscal_quarter,
          phrase: c.phrase,
          frequency: c.frequency,
          nlp_score: c.score,
          nlp_flags: JSON.stringify(c.flags),
        });
      }
      updateQueue.run(items.length, row.id);
    });
    insertMany(candidates);

    if (!perTicker[row.ticker]) perTicker[row.ticker] = [];
    perTicker[row.ticker].push(...candidates);
    log(
      `  ${row.ticker} ${row.fiscal_quarter}: ${candidates.length} candidate(s).`,
    );
  }

  // ─── Summary per ticker ─────────────────────────────────────────────────────
  log("Extractor complete.");
  for (const [tk, items] of Object.entries(perTicker)) {
    const flagged = items.filter((c) =>
      c.flags.includes("possible_person_name"),
    ).length;
    log(`  ${tk}:`);
    log(`    Candidates extracted: ${items.length}`);
    log(`    Flagged possible person name: ${flagged}`);
    const top = [...items].sort((a, b) => b.score - a.score).slice(0, 10);
    log("    Top 10 by score:");
    for (const c of top) {
      log(
        `      [${c.score}] "${c.phrase}" (freq ${c.frequency})${
          c.flags.length ? " " + JSON.stringify(c.flags) : ""
        }`,
      );
    }
  }

  db.close();
  return { processed: rows.length };
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
  try {
    runExtractor(parseArgs());
  } catch (err) {
    logError("extractor failed:", err.message);
    process.exit(1);
  }
}
