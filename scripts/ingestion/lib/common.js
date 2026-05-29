// common.js — shared helpers for the Group F ingestion pipeline.
// Loads env from the repo-root .env, opens the SQLite queue DB, builds the
// Supabase client, and exposes ticker/quarter mapping + NLP constants.

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// scripts/ingestion/lib → repo root is three levels up.
export const REPO_ROOT = path.resolve(__dirname, "../../..");

dotenv.config({ path: path.join(REPO_ROOT, ".env") });

export const DATA_DIR = path.join(REPO_ROOT, "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const DB_PATH = path.join(DATA_DIR, "ingestion-queue.db");
export const SOURCES_PATH = path.join(
  REPO_ROOT,
  "docs/research/transcript-sources.json",
);

// ─── Logging ─────────────────────────────────────────────────────────────────

export function log(...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...args);
}

export function logError(...args) {
  const ts = new Date().toISOString();
  console.error(`[${ts}]`, ...args);
}

// ─── SQLite queue + candidates ───────────────────────────────────────────────

export function getDb() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      company_id TEXT NOT NULL,
      fiscal_quarter TEXT NOT NULL,
      call_date TEXT,
      url TEXT,
      source_type TEXT,
      fetch_status TEXT DEFAULT 'pending',
      -- pending | fetched | failed | skip | pending-crawl
      raw_text_path TEXT,
      fetch_error TEXT,
      phrases_extracted INTEGER DEFAULT 0,
      phrases_staged INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_id INTEGER REFERENCES queue(id),
      ticker TEXT NOT NULL,
      fiscal_quarter TEXT NOT NULL,
      phrase TEXT NOT NULL,
      frequency INTEGER DEFAULT 1,
      nlp_score REAL DEFAULT 0,
      nlp_flags TEXT DEFAULT '[]',
      validation_status TEXT DEFAULT 'pending',
      -- pending | valid | rejected
      rejection_reason TEXT
    );
  `);

  return db;
}

// ─── Supabase ────────────────────────────────────────────────────────────────

export function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env",
    );
  }
  return createClient(url, key);
}

// ─── Ticker → company_id ─────────────────────────────────────────────────────
// The companies table has NO ticker column and the hotel companies already live
// under word-slug ids. Everything else uses the lowercase ticker as its id
// (matching the Task 1 seed-row shape). This map is the single source of truth
// for both queue-builder and staging-writer.

export const TICKER_TO_COMPANY_ID = {
  HLT: "hilton",
  KO: "ko",
  MAR: "marriott",
  H: "hyatt",
  IHG: "ihg",
  WH: "wyndham",
  CHH: "choice",
};

export function companyIdForTicker(ticker) {
  return TICKER_TO_COMPANY_ID[ticker] || ticker.toLowerCase();
}

// ─── Calendar quarter helpers ────────────────────────────────────────────────
// Every company shares the same window: Q1 2022 through Q1 2026 (17 quarters).
// fiscal_quarter is always stored as the calendar label "Q{N} {YYYY}".

export function quarterRange() {
  const out = [];
  for (let year = 2022; year <= 2025; year++) {
    for (let q = 1; q <= 4; q++) out.push({ q, year });
  }
  out.push({ q: 1, year: 2026 });
  return out;
}

export function quarterLabel(q, year) {
  return `Q${q} ${year}`;
}

export const TWO_DIGIT = (year) => String(year).slice(-2);

// ─── NLP constants (extractor) ───────────────────────────────────────────────

export const STOPWORDS = new Set([
  "a", "the", "and", "of", "in", "to", "for", "with", "on", "at", "by",
  "from", "as", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "not", "no", "nor", "but",
  "or", "yet", "so", "if", "then", "than", "that", "this", "these",
  "those", "it", "its", "we", "our", "they", "their", "you", "your",
  "i", "my",
]);

export const BOOST_TERMS = [
  "growth", "margin", "revenue", "cost", "efficiency", "strategy",
  "execution", "opportunity", "momentum", "headwind", "tailwind",
  "pipeline", "guidance", "outlook", "synergy", "leverage", "scale",
  "value", "performance", "investment", "capital", "return", "demand",
  "supply", "pricing", "volume", "organic", "adjusted", "normalized",
  "underlying", "sequential", "year-over-year", "quarter",
];

// Two consecutive title-cased words NOT in this list are flagged as a possible
// person name. These are known multi-word proper nouns that are safe.
export const ALLOWED_PROPER_NOUNS = new Set([
  "north america", "south america", "united states", "new york",
  "los angeles", "san francisco", "united kingdom", "european union",
  "middle east", "latin america", "asia pacific", "wall street",
  "main street", "federal reserve", "treasury department",
]);
