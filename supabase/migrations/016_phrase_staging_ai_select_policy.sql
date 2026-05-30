-- 016_phrase_staging_ai_select_policy.sql
-- Allows the anon key (used by ingestion scripts) to transition phrase_staging
-- rows from 'pending' to 'ai_selected' or 'ai_rejected'. The existing
-- authenticated-only UPDATE policy covers admin-panel approve/reject actions.

CREATE POLICY "phrase_staging_ai_select_update"
  ON phrase_staging FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status IN ('ai_selected', 'ai_rejected'));
