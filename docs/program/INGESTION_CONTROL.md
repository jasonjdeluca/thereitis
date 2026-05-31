# Ingestion Control — Admin-Driven Docker Pipeline

Lets you run the **deterministic** Docker ingestion pipeline (fetch → extract →
validate) from the admin panel — on demand or on a schedule — **without a Claude
Code session**. The AI enrichment step is deliberately *not* automated here; it
stays a subscription task (see [ENRICHMENT_QUEUE.md](ENRICHMENT_QUEUE.md)). The
admin surfaces *when* enrichment is waiting so you only spend tokens on judgment.

## Architecture

```
Admin SPA (Vercel) ──insert──▶ Supabase ingestion_runs (status: requested)
        ▲                              │
        │ reads status                 │ claims (service role, bypasses RLS)
        │                              ▼
Supabase ingestion_status ◀──publish── VPS poller (cron) ── runs ──▶ Docker
   ready_to_fetch / pending_enrichment / jobs        fetch → extract → validate
```

The admin app is static on Vercel and can't run Docker directly, so it
coordinates through two Supabase tables. The poller runs on the VPS where Docker
lives.

## What the admin panel shows (Ingestion Pipeline section)

- **Ready to fetch** — companies whose manifest has fetchable (non-StockAnalysis)
  sources and aren't done yet, with their fetchable-quarter count.
- **Waiting for enrichment** — companies sitting in `data/review-queue/` that need
  a Claude session to select phrases/trivia.
- **Run pipeline** button — enqueues a `scope: 'ready'` run (capped at 5 companies).
- **Recent runs** — status + per-company fetched/total summary.

## One-time setup

1. **Apply the migration** (human-run, per project rules):
   `supabase/migrations/018_ingestion_control.sql` — creates `ingestion_runs` and
   `ingestion_status` with RLS (authenticated admins request/read; the service-role
   poller writes status).

2. **Add the service-role key to the VPS `.env`** (gitignored; the poller needs it
   to write status and claim runs past RLS):
   ```
   SUPABASE_SERVICE_ROLE_KEY=<service role key from Supabase dashboard>
   ```
   `SUPABASE_URL` falls back to `VITE_SUPABASE_URL`, already present.

3. **Build the ops-worker images** (once): `cd ops-worker && docker compose build`.

4. **Add the cron entries on the VPS:**
   ```cron
   # Process requests + republish status every 3 minutes
   */3 * * * * cd /home/jason/thereitis && node scripts/ingestion/poller.js >> /var/log/thereitis-poller.log 2>&1

   # Nightly: enqueue a run for whatever is ready (the scheduled half)
   0 2 * * * cd /home/jason/thereitis && node scripts/ingestion/poller.js --enqueue >> /var/log/thereitis-poller.log 2>&1
   ```

## How a run executes

For each target company the poller deletes its `phase2_quarters` rows and resets
the job to `sources_ready`, so the fetcher re-seeds quarters from the **current**
manifest (the fetcher now upserts `accepted_url`, so repaired URLs always win — the
stale-URL bug that stranded BA/MMM/KO can't recur). Then it runs the fetcher per
ticker, then the extractor and validator once. Results land in
`data/review-queue/{TICKER}.json` and the run summary is written back to Supabase.

A file lock (`data/poller.lock`, 30-min stale timeout) prevents overlapping poller
processes, and the poller skips claiming a new run while one is `running`.

## The boundary (why this saves tokens)

Everything **up to** enrichment is deterministic and runs with no agent and no
tokens. Enrichment still needs a Claude Code session — but the panel tells you
exactly which companies are waiting, and the Session Start Protocol
(`process-review-queue.js --list`) means the next agent auto-picks them up. So the
loop is: click **Run** (or let the nightly cron do it) → pipeline fills the
enrichment queue → start a session only when there's real judgment work.
