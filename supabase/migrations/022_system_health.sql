-- 022_system_health.sql
-- Out-of-band heartbeat for detecting VPS cron failure.
-- The external checker reads the singleton row with the anon key; only the
-- service-role cron writer mutates it.
--
-- HUMAN REVIEW REQUIRED — run this manually in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS system_health (
  id                int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  source            text,
  details           jsonb NOT NULL DEFAULT '{}'::jsonb
);
INSERT INTO system_health (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Public read access lets the external checker use the anon key.
CREATE POLICY system_health_select_public ON system_health
  FOR SELECT USING (true);
