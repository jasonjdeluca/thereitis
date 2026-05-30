#!/usr/bin/env node
// ingestion-status.js — reads phase2_jobs from the SQLite queue and writes
// reports/ingestion-status.json for Codex nightly ingestion triage automation.

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DB_PATH = process.env.DB_PATH || path.join(REPO_ROOT, 'data', 'ingestion-queue.db');
const OUT_PATH = path.join(REPO_ROOT, 'reports', 'ingestion-status.json');

function run() {
  let jobs = [];

  try {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      jobs = db.prepare('SELECT * FROM phase2_jobs ORDER BY updated_at DESC').all();
    } catch {
      // Table may not exist yet if queue-init hasn't run
    }
    db.close();
  } catch {
    // DB file doesn't exist yet
  }

  const summary = {};
  for (const job of jobs) {
    summary[job.status] = (summary[job.status] || 0) + 1;
  }

  const report = {
    generated_at: new Date().toISOString(),
    total_companies: jobs.length,
    summary,
    blocked: jobs
      .filter(j => ['validation_failed', 'fetch_failed', 'extract_failed'].includes(j.status))
      .map(j => ({ ticker: j.ticker, status: j.status, error: j.error_message })),
    ready_for_review: jobs
      .filter(j => j.status === 'ready_for_review')
      .map(j => ({ ticker: j.ticker, updated_at: j.updated_at, pr_url: j.pr_url })),
    in_progress: jobs
      .filter(j => ['fetching', 'fetched', 'extracting', 'extracted', 'generating'].includes(j.status))
      .map(j => ({
        ticker: j.ticker,
        status: j.status,
        quarters_total: j.quarters_total,
        quarters_fetched: j.quarters_fetched,
        quarters_extracted: j.quarters_extracted,
      })),
    companies: jobs.map(j => ({
      ticker: j.ticker,
      company_id: j.company_id,
      status: j.status,
      quarters_total: j.quarters_total,
      quarters_fetched: j.quarters_fetched,
      quarters_extracted: j.quarters_extracted,
      error: j.error_message,
      pr_url: j.pr_url,
      updated_at: j.updated_at,
    })),
  };

  mkdirSync(path.join(REPO_ROOT, 'reports'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));
  console.log(`[ingestion-status] ${jobs.length} companies — ${JSON.stringify(summary)}`);
}

run();
