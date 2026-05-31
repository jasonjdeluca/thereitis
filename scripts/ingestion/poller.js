#!/usr/bin/env node
// poller.js — VPS-side control loop for the deterministic Docker ingestion
// pipeline. Runs on a cron (every few minutes). It does NOT do AI enrichment;
// that stays a Claude Code subscription task (see docs/program/ENRICHMENT_QUEUE.md).
//
// Each tick (default mode):
//   1. Republish a status snapshot to Supabase ingestion_status (what's ready to
//      fetch, what's waiting for enrichment, per-company job states).
//   2. Claim the oldest ingestion_runs row with status='requested', run the
//      pipeline for its targets (fetch → extract → validate), write the result.
//
// --enqueue mode (nightly cron): if any companies are ready and no run is
//   already queued/running, insert a scope='ready' run request.
//
// Env (VPS .env): SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
// Requires Docker + the ops-worker images built.

import { readFileSync, readdirSync, existsSync, openSync, closeSync, unlinkSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { REPO_ROOT, DATA_DIR, DB_PATH, log, logError } from './lib/common.js';

const PACKS_DIR = path.join(REPO_ROOT, 'company-packs');
const REVIEW_QUEUE_DIR = path.join(DATA_DIR, 'review-queue');
const OPS_DIR = path.join(REPO_ROOT, 'ops-worker');
const LOCK_PATH = path.join(DATA_DIR, 'poller.lock');
const LOCK_STALE_MS = 30 * 60 * 1000;
const RUN_CAP = 5;                 // max companies per run
const DOCKER_TIMEOUT_MS = 25 * 60 * 1000;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// A quarter is fetchable if its source isn't the bot-blocked StockAnalysis host.
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } }
const fetchable = u => { const h = hostOf(u); return !!h && !h.includes('stockanalysis'); };

// ── Status computation (read-only) ────────────────────────────────────────────
function readJobs(db) {
  return db.prepare(`SELECT company_id, ticker, status, quarters_fetched, quarters_total FROM phase2_jobs`).all();
}

function computeReady(db) {
  const jobByCid = new Map(readJobs(db).map(j => [j.company_id, j]));
  let tickers = [];
  try { tickers = readdirSync(PACKS_DIR); } catch { tickers = []; }
  const ready = [];
  for (const ticker of tickers) {
    const manifestPath = path.join(PACKS_DIR, ticker, 'source_manifest.json');
    if (!existsSync(manifestPath)) continue;
    let m; try { m = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { continue; }
    const fetchableQ = (m.quarters || []).filter(q => q.accepted_url && fetchable(q.accepted_url)).length;
    if (fetchableQ === 0) continue;
    const hasGenerated = existsSync(path.join(PACKS_DIR, ticker, 'generated', 'phrases.json'));
    const status = jobByCid.get(ticker.toLowerCase())?.status;
    if (hasGenerated || status === 'ready_for_review') continue;
    ready.push({ ticker, fetchable_quarters: fetchableQ });
  }
  return ready.sort((a, b) => b.fetchable_quarters - a.fetchable_quarters);
}

function pendingEnrichment() {
  if (!existsSync(REVIEW_QUEUE_DIR)) return [];
  return readdirSync(REVIEW_QUEUE_DIR).filter(f => f.endsWith('.json')).map(f => path.basename(f, '.json')).sort();
}

async function refreshStatus(sb) {
  const db = new Database(DB_PATH); db.pragma('journal_mode = WAL');
  const ready = computeReady(db);
  const jobs = readJobs(db).map(j => ({ ticker: j.ticker, status: j.status, fetched: j.quarters_fetched, total: j.quarters_total }));
  db.close();
  const pending = pendingEnrichment();
  const { error } = await sb.from('ingestion_status').upsert({
    id: 1, updated_at: new Date().toISOString(),
    ready_to_fetch: ready, pending_enrichment: pending, jobs,
  });
  if (error) logError(`status upsert failed: ${error.message}`);
  else log(`status: ${ready.length} ready, ${pending.length} pending enrichment, ${jobs.length} jobs`);
}

// ── Run execution ─────────────────────────────────────────────────────────────
function resetTargets(targets) {
  const db = new Database(DB_PATH); db.pragma('journal_mode = WAL');
  const delQ = db.prepare(`DELETE FROM phase2_quarters WHERE company_id = ?`);
  const updJ = db.prepare(`UPDATE phase2_jobs SET status='sources_ready', quarters_fetched=0, quarters_extracted=0, error_message=NULL, updated_at=datetime('now') WHERE company_id = ?`);
  for (const t of targets) { const cid = t.toLowerCase(); delQ.run(cid); updJ.run(cid); }
  db.close();
}

function docker(args) {
  execSync(`docker compose ${args}`, { cwd: OPS_DIR, stdio: 'inherit', timeout: DOCKER_TIMEOUT_MS });
}

function buildSummary(targets) {
  const db = new Database(DB_PATH); db.pragma('journal_mode = WAL');
  const get = db.prepare(`SELECT quarters_fetched, quarters_total, status FROM phase2_jobs WHERE company_id = ?`);
  const summary = targets.map(t => {
    const j = get.get(t.toLowerCase()) || {};
    return { ticker: t, fetched: j.quarters_fetched || 0, total: j.quarters_total || 0,
             status: j.status || '?', queued: existsSync(path.join(REVIEW_QUEUE_DIR, `${t}.json`)) };
  });
  db.close();
  return summary;
}

async function processRun(sb) {
  const { data: running } = await sb.from('ingestion_runs').select('id').eq('status', 'running').limit(1);
  if (running && running.length) { log('a run is already running — skipping'); return; }
  const { data: reqs } = await sb.from('ingestion_runs').select('*').eq('status', 'requested').order('requested_at', { ascending: true }).limit(1);
  if (!reqs || !reqs.length) return;
  const run = reqs[0];
  await sb.from('ingestion_runs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', run.id);
  log(`claimed run ${run.id} (scope=${run.scope})`);

  try {
    let targets;
    if (!run.scope || run.scope === 'ready') {
      const db = new Database(DB_PATH); const ready = computeReady(db); db.close();
      targets = ready.map(r => r.ticker).slice(0, RUN_CAP);
    } else {
      targets = run.scope.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, RUN_CAP);
    }
    if (targets.length === 0) {
      await sb.from('ingestion_runs').update({ status: 'done', finished_at: new Date().toISOString(), summary: [], error: 'no companies ready to fetch' }).eq('id', run.id);
      log('run done — nothing ready'); return;
    }
    log(`running pipeline for: ${targets.join(', ')}`);
    resetTargets(targets);
    for (const t of targets) docker(`run --rm -e TICKER=${t} -e DELAY_MS=500 fetcher`);
    docker('run --rm extractor');
    docker('run --rm validator');
    const summary = buildSummary(targets);
    await sb.from('ingestion_runs').update({ status: 'done', finished_at: new Date().toISOString(), summary }).eq('id', run.id);
    log(`run ${run.id} done: ${summary.map(s => `${s.ticker} ${s.fetched}/${s.total}`).join(', ')}`);
  } catch (e) {
    logError(`run ${run.id} failed: ${e.message}`);
    await sb.from('ingestion_runs').update({ status: 'error', finished_at: new Date().toISOString(), error: String(e.message || e).slice(0, 2000) }).eq('id', run.id);
  }
}

async function enqueueReady(sb) {
  const { data: open } = await sb.from('ingestion_runs').select('id').in('status', ['requested', 'running']).limit(1);
  if (open && open.length) { log('a run is already queued/running — not enqueueing'); return; }
  const db = new Database(DB_PATH); const ready = computeReady(db); db.close();
  if (ready.length === 0) { log('nothing ready — not enqueueing'); return; }
  const { error } = await sb.from('ingestion_runs').insert({ scope: 'ready', requested_by: 'cron', status: 'requested' });
  if (error) logError(`enqueue failed: ${error.message}`);
  else log(`enqueued a scope=ready run (${ready.length} companies ready)`);
}

// ── Lock (prevent overlapping poller processes) ───────────────────────────────
function acquireLock() {
  try { const fd = openSync(LOCK_PATH, 'wx'); closeSync(fd); writeFileSync(LOCK_PATH, String(process.pid)); return true; }
  catch (e) {
    if (e.code !== 'EEXIST') throw e;
    try { if (Date.now() - statSync(LOCK_PATH).mtimeMs > LOCK_STALE_MS) { unlinkSync(LOCK_PATH); return acquireLock(); } } catch {}
    return false;
  }
}
const releaseLock = () => { try { unlinkSync(LOCK_PATH); } catch {} };

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in the environment (.env on the VPS).');
    process.exit(1);
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  if (!acquireLock()) { log('another poller holds the lock — exiting'); return; }
  try {
    if (process.argv.includes('--enqueue')) { await enqueueReady(sb); return; }
    await refreshStatus(sb);
    await processRun(sb);
    await refreshStatus(sb);
  } finally { releaseLock(); }
}

main().catch(e => { releaseLock(); logError('Fatal:', e.message); process.exit(1); });
