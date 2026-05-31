-- 018_ingestion_control.sql
-- Admin-driven control plane for the DETERMINISTIC Docker ingestion pipeline
-- (fetch → extract → validate). The AI enrichment step is NOT controlled here —
-- that remains a Claude Code subscription task (see docs/program/ENRICHMENT_QUEUE.md).
--
-- Flow: the admin SPA inserts an ingestion_runs row (status='requested'); a VPS
-- poller running as the service role claims it, runs the pipeline, and writes the
-- result back. The poller also republishes a status snapshot each tick so the
-- admin can show what is ready to fetch and what is waiting for enrichment.
--
-- HUMAN REVIEW REQUIRED — run this manually in the Supabase SQL editor.

-- ── Run requests + history ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  requested_by  text,
  scope         text NOT NULL DEFAULT 'ready',  -- 'ready' or comma-separated tickers
  status        text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','running','done','error')),
  started_at    timestamptz,
  finished_at   timestamptz,
  summary       jsonb,   -- [{ticker, fetched, total, queued}]
  error         text
);
CREATE INDEX IF NOT EXISTS ingestion_runs_status_idx ON ingestion_runs (status, requested_at);

-- ── Singleton status snapshot, republished by the poller each tick ────────────
CREATE TABLE IF NOT EXISTS ingestion_status (
  id                 int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  ready_to_fetch     jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{ticker, fetchable_quarters}]
  pending_enrichment jsonb NOT NULL DEFAULT '[]'::jsonb,  -- ["BA","MMM",...]
  jobs               jsonb NOT NULL DEFAULT '[]'::jsonb   -- [{ticker,status,fetched,total}]
);
INSERT INTO ingestion_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE ingestion_runs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_status ENABLE ROW LEVEL SECURITY;

-- Authenticated admins may request runs and read run history.
CREATE POLICY ingestion_runs_select_auth ON ingestion_runs
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY ingestion_runs_insert_auth ON ingestion_runs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- No UPDATE/DELETE policy for authenticated users: only the service-role poller
-- mutates run status, and the service role bypasses RLS.

-- Authenticated admins may read the status snapshot (poller writes via service role).
CREATE POLICY ingestion_status_select_auth ON ingestion_status
  FOR SELECT USING (auth.uid() IS NOT NULL);
