-- Retroactive migration: this table already exists in the live DB.
-- This file documents the schema for version control purposes.
-- Do NOT re-run against a live DB without checking for existence first.
-- Applied: prior to 2026-05-27 (exact date unknown; table present at project creation).

CREATE TABLE IF NOT EXISTS companies (
  id                    text            PRIMARY KEY,
  name                  text            NOT NULL,
  emoji                 text            NOT NULL DEFAULT '🏨',
  next_earnings_date    timestamptz,
  next_earnings_timezone text           DEFAULT 'America/New_York',
  call_identifier       text,
  is_active             boolean         DEFAULT true,
  phrase_count          integer         DEFAULT 0,
  total_sessions        integer         DEFAULT 0,
  created_at            timestamptz     DEFAULT now()
);

-- Enable realtime (already present in supabase_realtime publication)
-- alter publication supabase_realtime add table companies;

-- Enable Row-Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "companies_select_all"
  ON companies FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "companies_insert_admin"
  ON companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "companies_update_admin"
  ON companies FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "companies_delete_admin"
  ON companies FOR DELETE USING (auth.role() = 'authenticated');
