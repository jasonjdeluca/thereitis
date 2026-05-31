-- 017_fix_phrase_staging_rls.sql
-- Fix phrase_staging UPDATE and DELETE policies to use auth.uid() IS NOT NULL
-- instead of auth.role() = 'authenticated'. The role() check does not evaluate
-- correctly for UPDATE/DELETE in RLS context; uid() IS NOT NULL is reliable.
-- Mirrors the same fix applied to the phrases table in fix_phrases_rls_uid_check.

DROP POLICY IF EXISTS "phrase_staging_update_auth" ON phrase_staging;
CREATE POLICY "phrase_staging_update_auth"
  ON phrase_staging FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "phrase_staging_delete_auth" ON phrase_staging;
CREATE POLICY "phrase_staging_delete_auth"
  ON phrase_staging FOR DELETE
  USING (auth.uid() IS NOT NULL);
