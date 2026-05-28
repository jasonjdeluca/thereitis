-- Phrases table for DB-driven card generation.
-- Executed via Supabase MCP on 2026-05-28.
-- ingest.js populates this table per company from PDF transcripts.

CREATE TABLE phrases (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    text         REFERENCES companies(id),
  phrase        text         NOT NULL,
  tier          text         NOT NULL,
  points        integer      NOT NULL,
  ceo_mode      boolean      DEFAULT true,
  special_square text,
  is_active     boolean      DEFAULT true,
  created_at    timestamptz  DEFAULT now(),
  CHECK (char_length(phrase) <= 25)
);

CREATE INDEX phrases_company_idx ON phrases(company_id);

ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phrases_select_all"   ON phrases FOR SELECT USING (true);
CREATE POLICY "phrases_insert_admin" ON phrases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "phrases_update_admin" ON phrases FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "phrases_delete_admin" ON phrases FOR DELETE USING (auth.role() = 'authenticated');
