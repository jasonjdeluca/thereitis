#!/usr/bin/env node
// fetcher — Phase 2 Stage 1.
// Seeds phase2_jobs from company-packs/*/source_manifest.json, then downloads
// pending transcript PDFs to company-packs/{ticker}/transcripts/.
// Env: DELAY_MS (default 2000), COMPANY_LIMIT (default 5), TICKER (optional)

import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const PACKS_DIR = process.env.PACKS_DIR || '/app/company-packs';
const DB_PATH = path.join(DATA_DIR, 'ingestion-queue.db');
const DELAY_MS = parseInt(process.env.DELAY_MS || '2000', 10);
const COMPANY_LIMIT = parseInt(process.env.COMPANY_LIMIT || '5', 10);
const TICKER_FILTER = process.env.TICKER?.toUpperCase() || null;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ts = () => new Date().toISOString();
const log = (...a) => console.log(`[${ts()}]`, ...a);
const logErr = (...a) => console.error(`[${ts()}]`, ...a);

function openDb() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS phase2_jobs (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id          TEXT    NOT NULL UNIQUE,
      ticker              TEXT    NOT NULL,
      status              TEXT    NOT NULL DEFAULT 'sources_ready',
      quarters_total      INTEGER NOT NULL DEFAULT 0,
      quarters_fetched    INTEGER NOT NULL DEFAULT 0,
      quarters_extracted  INTEGER NOT NULL DEFAULT 0,
      error_message       TEXT,
      pr_url              TEXT,
      pr_number           INTEGER,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS phase2_quarters (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id      TEXT    NOT NULL,
      fiscal_quarter  TEXT    NOT NULL,
      accepted_url    TEXT,
      source_type     TEXT,
      fetch_status    TEXT    NOT NULL DEFAULT 'pending',
      transcript_path TEXT,
      extract_status  TEXT    NOT NULL DEFAULT 'pending',
      candidates_path TEXT,
      phrase_count    INTEGER NOT NULL DEFAULT 0,
      fetch_error     TEXT,
      extract_error   TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(company_id, fiscal_quarter)
    );
  `);
  return db;
}

function seedJobs(db) {
  const upsertJob = db.prepare(`
    INSERT INTO phase2_jobs (company_id, ticker, status, quarters_total)
    VALUES (?, ?, 'sources_ready', ?)
    ON CONFLICT(company_id) DO NOTHING
  `);
  // Re-sync accepted_url/source_type from the current manifest on every seed.
  // (Previously DO NOTHING, which stranded companies on stale pre-repair URLs —
  // e.g. the queue still held StockAnalysis links after a manifest was fixed to
  // q4cdn.) fetch_status is intentionally NOT reset here, so already-fetched
  // quarters stay fetched; the poller resets status when it wants a re-fetch.
  const upsertQ = db.prepare(`
    INSERT INTO phase2_quarters (company_id, fiscal_quarter, accepted_url, source_type)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(company_id, fiscal_quarter)
    DO UPDATE SET accepted_url = excluded.accepted_url, source_type = excluded.source_type
  `);

  let seeded = 0;
  let tickers;
  try { tickers = readdirSync(PACKS_DIR); } catch { tickers = []; }

  for (const ticker of tickers) {
    const manifestPath = path.join(PACKS_DIR, ticker, 'source_manifest.json');
    if (!existsSync(manifestPath)) continue;

    let manifest;
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
    catch { logErr(`Could not parse ${manifestPath}`); continue; }

    const quarters = manifest.quarters ?? [];
    if (!quarters.length) continue;

    // Accept both official PDF sources and third-party HTML transcript pages
    const queueable = quarters.filter(q => q.accepted_url);
    if (queueable.length === 0) continue;

    const companyId = ticker.toLowerCase();
    upsertJob.run(companyId, ticker, queueable.length);
    for (const q of queueable) {
      upsertQ.run(companyId, q.fiscal_quarter, q.accepted_url, q.source_type);
    }
    seeded++;
  }

  log(`Seeded ${seeded} companies (official PDF + third-party HTML).`);
}

const THIRD_PARTY_HTML_HOSTS = ['stockanalysis.com', 'fool.com', 'nasdaq.com', 'seekingalpha.com'];

function isHtmlSource(source_type, url) {
  if (source_type === 'third_party_transcript_provider') return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return THIRD_PARTY_HTML_HOSTS.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

function extractHtmlText(html) {
  // Strip tags, collapse whitespace — lightweight text extraction without cheerio
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function downloadPdf(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`Response too small (${buf.length}b) — likely not a PDF`);
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  const db = openDb();
  seedJobs(db);

  const conditions = ["(status = 'sources_ready' OR status = 'fetching')"];
  const params = [];
  if (TICKER_FILTER) { conditions.push('ticker = ?'); params.push(TICKER_FILTER); }

  const jobs = db.prepare(
    `SELECT * FROM phase2_jobs WHERE ${conditions.join(' AND ')} ORDER BY created_at LIMIT ?`
  ).all(...params, COMPANY_LIMIT);

  log(`Processing ${jobs.length} company job(s).`);

  const setJob = db.prepare(
    `UPDATE phase2_jobs SET status=?, error_message=?, updated_at=datetime('now') WHERE company_id=?`
  );
  const setQ = db.prepare(
    `UPDATE phase2_quarters SET fetch_status=?, transcript_path=?, fetch_error=?, updated_at=datetime('now') WHERE company_id=? AND fiscal_quarter=?`
  );
  const incrFetched = db.prepare(
    `UPDATE phase2_jobs SET quarters_fetched=quarters_fetched+1, updated_at=datetime('now') WHERE company_id=?`
  );

  for (const job of jobs) {
    log(`--- ${job.ticker} ---`);
    setJob.run('fetching', null, job.company_id);

    const quarters = db.prepare(
      `SELECT * FROM phase2_quarters WHERE company_id=? AND fetch_status='pending' AND accepted_url IS NOT NULL`
    ).all(job.company_id);

    const transcriptsDir = path.join(PACKS_DIR, job.ticker, 'transcripts');
    mkdirSync(transcriptsDir, { recursive: true });

    let fetched = 0, failed = 0;

    for (let i = 0; i < quarters.length; i++) {
      const q = quarters[i];
      if (i > 0) await sleep(DELAY_MS);

      const safeFQ = q.fiscal_quarter.replace(/\s+/g, '-').replace(/[^\w.-]/g, '');
      const useHtml = isHtmlSource(q.source_type, q.accepted_url);
      const destPath = path.join(transcriptsDir, `${safeFQ}.${useHtml ? 'txt' : 'pdf'}`);

      log(`  [${q.fiscal_quarter}] ${useHtml ? 'html' : 'pdf'} — ${q.accepted_url}`);
      try {
        let bytes;
        if (useHtml) {
          const res = await fetch(q.accepted_url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
          const text = extractHtmlText(await res.text());
          if (text.length < 500) throw new Error(`Extracted text too short (${text.length} chars)`);
          writeFileSync(destPath, text, 'utf8');
          bytes = text.length;
        } else {
          bytes = await downloadPdf(q.accepted_url, destPath);
        }
        setQ.run('fetched', destPath, null, job.company_id, q.fiscal_quarter);
        incrFetched.run(job.company_id);
        fetched++;
        log(`  → ${bytes.toLocaleString()} chars/bytes`);
      } catch (e) {
        setQ.run('failed', null, e.message, job.company_id, q.fiscal_quarter);
        failed++;
        logErr(`  ✗ ${e.message}`);
      }
    }

    const newStatus = fetched === 0 ? 'fetch_failed' : 'fetched';
    const errMsg = failed > 0 ? `${failed}/${quarters.length} quarters failed` : null;
    setJob.run(newStatus, errMsg, job.company_id);
    log(`${job.ticker}: ${fetched} fetched, ${failed} failed → ${newStatus}`);
  }

  db.close();
  log('Fetcher done.');
}

main().catch(e => { logErr('Fatal:', e.message); process.exit(1); });
