-- Retroactive migration: this table already exists in the live DB.
-- This file documents the schema for version control purposes.
-- Do NOT re-run against a live DB without checking for existence first.

CREATE TABLE IF NOT EXISTS trivia_questions (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      text    REFERENCES companies(id),
  question        text    NOT NULL,
  option_a        text    NOT NULL,
  option_b        text    NOT NULL,
  option_c        text    NOT NULL,
  option_d        text    NOT NULL,
  correct_answer  text    NOT NULL,
  category        text    NOT NULL,
  difficulty      text    NOT NULL,
  fun_fact        text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trivia_questions_company_id_idx  ON trivia_questions(company_id);
CREATE INDEX IF NOT EXISTS trivia_questions_difficulty_idx  ON trivia_questions(difficulty);

-- Enable realtime (already present in supabase_realtime publication)
-- alter publication supabase_realtime add table trivia_questions;

-- Enable Row-Level Security
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "trivia_select_all"
  ON trivia_questions FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "trivia_insert_admin"
  ON trivia_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "trivia_update_admin"
  ON trivia_questions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "trivia_delete_admin"
  ON trivia_questions FOR DELETE USING (auth.role() = 'authenticated');
