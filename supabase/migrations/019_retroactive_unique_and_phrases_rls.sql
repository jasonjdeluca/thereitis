-- 019_retroactive_unique_and_phrases_rls.sql
-- RETROACTIVE migration documenting changes already applied in production.
-- The constraint was applied via raw SQL; the RLS changes were applied as the
-- history entry fix_phrases_rls_uid_check (20260531023120).
-- Safe and idempotent to re-run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'phrases_company_phrase_unique'
  ) THEN
    ALTER TABLE phrases
      ADD CONSTRAINT phrases_company_phrase_unique UNIQUE (company_id, phrase);
  END IF;
END $$;

DROP POLICY IF EXISTS "phrases_insert_admin" ON phrases;
CREATE POLICY "phrases_insert_admin"
  ON phrases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "phrases_update_admin" ON phrases;
CREATE POLICY "phrases_update_admin"
  ON phrases FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "phrases_delete_admin" ON phrases;
CREATE POLICY "phrases_delete_admin"
  ON phrases FOR DELETE
  USING (auth.uid() IS NOT NULL);
