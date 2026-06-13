#!/usr/bin/env node
// fetcher.js — Stage 1.
// Fetches pending queue rows that have a URL, extracts plain text (HTML via
// cheerio, PDF via pdf-parse), saves it under data/raw/{ticker}/, and flips the
// queue row to 'fetched' or 'failed'. Errors never abort the run.

import { fileURLToPath } from "url";
import path from "path";
import { mkdirSync, writeFileSync } from "fs";
import { load } from "cheerio";
import { PDFParse } from "pdf-parse";
import { getDb, log, logError, RAW_DIR } from "./lib/common.js";

async function pdfToText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy?.();
  }
}

const DELAY_MS = 1500;
const DEFAULT_LIMIT = 50;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const HTML_HOSTS = [
  "fool.com",
  "nasdaq.com",
  "marketbeat.com",
  "stockanalysis.com",
  "verizon.com",
  "microsoft.com",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function safeName(fiscalQuarter) {
  return fiscalQuarter.replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isPdf(row) {
  const st = (row.source_type || "").toLowerCase();
  if (st.includes("pdf")) return true;
  if ((row.url || "").toLowerCase().endsWith(".pdf")) return true;
  return false;
}

function isHtml(row) {
  const st = (row.source_type || "").toLowerCase();
  if (st.includes("html") || st.includes("embedded")) return true;
  const host = hostOf(row.url);
  return HTML_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

function extractHtmlText(html) {
  const $ = load(html);
  $("nav, header, footer, aside, script, style").remove();
  const body = $("body");
  const text = (body.length ? body.text() : $.root().text()) || "";
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function runFetcher({ ticker = null, limit = null } = {}) {
  const db = getDb();

  const filterTicker = ticker ? ticker.toUpperCase() : null;
  // Orchestrator passes a single ticker and no limit (process everything for it).
  const effectiveLimit = limit == null ? DEFAULT_LIMIT : limit;

  let query =
    "SELECT * FROM queue WHERE fetch_status = 'pending' AND url IS NOT NULL";
  const params = [];
  if (filterTicker) {
    query += " AND ticker = ?";
    params.push(filterTicker);
  }
  query += " ORDER BY id";
  if (filterTicker == null) {
    query += " LIMIT ?";
    params.push(effectiveLimit);
  }

  const rows = db.prepare(query).all(...params);
  log(`Fetcher starting — ${rows.length} row(s) to process.`);

  const update = db.prepare(
    "UPDATE queue SET fetch_status = ?, raw_text_path = ?, fetch_error = ?, updated_at = datetime('now') WHERE id = ?",
  );

  let fetched = 0;
  const failures = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i > 0) await sleep(DELAY_MS);

    log(`[${row.ticker} ${row.fiscal_quarter}] fetching ${row.url}`);
    try {
      const res = await fetch(row.url, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const dir = path.join(RAW_DIR, row.ticker);
      mkdirSync(dir, { recursive: true });
      const base = safeName(row.fiscal_quarter);
      const txtPath = path.join(dir, `${base}.txt`);

      let text;
      if (isPdf(row)) {
        const buf = Buffer.from(await res.arrayBuffer());
        writeFileSync(path.join(dir, `${base}.pdf`), buf);
        text = await pdfToText(buf);
      } else if (isHtml(row)) {
        const html = await res.text();
        text = extractHtmlText(html);
      } else {
        // Unknown source type — fall back to raw text capture.
        text = (await res.text()).trim();
      }

      if (!text) throw new Error("Extracted text was empty");

      writeFileSync(txtPath, text, "utf8");
      update.run("fetched", txtPath, null, row.id);
      fetched++;
      log(`  → saved ${text.length} chars to ${path.relative(RAW_DIR, txtPath)}`);
    } catch (err) {
      const msg = err.message || String(err);
      update.run("failed", null, msg, row.id);
      failures.push({ ticker: row.ticker, fq: row.fiscal_quarter, msg });
      logError(`  ✗ ${row.ticker} ${row.fiscal_quarter}: ${msg}`);
    }
  }

  // Remaining pending count (respecting ticker scope).
  let pendingQuery =
    "SELECT COUNT(*) AS n FROM queue WHERE fetch_status = 'pending' AND url IS NOT NULL";
  const pendingParams = [];
  if (filterTicker) {
    pendingQuery += " AND ticker = ?";
    pendingParams.push(filterTicker);
  }
  const remaining = db.prepare(pendingQuery).get(...pendingParams).n;

  log("Fetcher complete.");
  log(`  Fetched successfully: ${fetched}`);
  log(`  Failed: ${failures.length}`);
  for (const f of failures) log(`    ${f.ticker} ${f.fq}: ${f.msg}`);
  log(`  Remaining pending: ${remaining}`);

  db.close();
  return { fetched, failed: failures.length, remaining };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ticker") out.ticker = args[++i];
    else if (args[i] === "--limit") out.limit = parseInt(args[++i], 10);
  }
  return out;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runFetcher(parseArgs()).catch((err) => {
    logError("fetcher failed:", err.message);
    process.exit(1);
  });
}
