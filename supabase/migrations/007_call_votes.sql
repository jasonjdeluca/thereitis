-- Retroactive migration: this table already exists in the live DB.
-- This file documents the schema for version control purposes.
-- Do NOT re-run against a live DB without checking for existence first.
--
-- call_votes stores each player's single vote for "Word of the Call" per session.
-- The UNIQUE constraint on (session_id, player_id) enforces one vote per player.

CREATE TABLE IF NOT EXISTS call_votes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   uuid        REFERENCES players(id)  ON DELETE CASCADE,
  phrase      text        NOT NULL,
  voted_at    timestamptz DEFAULT now(),
  UNIQUE (session_id, player_id)
);

CREATE INDEX IF NOT EXISTS call_votes_session_id_idx ON call_votes(session_id);

-- Enable realtime (already present in supabase_realtime publication)
-- alter publication supabase_realtime add table call_votes;

-- Enable Row-Level Security
ALTER TABLE call_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "call_votes_select_all"
  ON call_votes FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "call_votes_insert_anon"
  ON call_votes FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "call_votes_delete_admin"
  ON call_votes FOR DELETE USING (auth.role() = 'authenticated');
