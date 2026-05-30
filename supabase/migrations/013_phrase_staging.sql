-- 013_phrase_staging.sql
-- Staging table for ingestion pipeline review (Group F).
-- Ingestion scripts write here with anon key; admin panel reads/updates with
-- authenticated session. INSERT is public so staging-writer.js can run without
-- a service-role key.

CREATE TABLE phrase_staging (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     text        NOT NULL REFERENCES companies(id),
  phrase         text        NOT NULL,
  source_ticker  text,
  source_quarter text,
  source_url     text,
  source_type    text,
  nlp_score      real        NOT NULL DEFAULT 0,
  nlp_flags      jsonb       NOT NULL DEFAULT '[]',
  status         text        NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE phrase_staging ENABLE ROW LEVEL SECURITY;

-- SELECT: public (admin panel + scripts both read with anon key)
CREATE POLICY "phrase_staging_select_public"
  ON phrase_staging FOR SELECT USING (true);

-- INSERT: public (staging-writer.js runs with anon key)
CREATE POLICY "phrase_staging_insert_public"
  ON phrase_staging FOR INSERT WITH CHECK (true);

-- UPDATE/DELETE: authenticated only (approve/reject actions in admin panel)
CREATE POLICY "phrase_staging_update_auth"
  ON phrase_staging FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "phrase_staging_delete_auth"
  ON phrase_staging FOR DELETE USING (auth.role() = 'authenticated');
