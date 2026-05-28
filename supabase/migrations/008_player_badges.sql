-- Retroactive migration: this table already exists in the live DB.
-- This file documents the schema for version control purposes.
-- Do NOT re-run against a live DB without checking for existence first.
--
-- player_badges records badges earned by a player during a session.
-- badge_id matches the keys in src/lib/badges.js BADGE_DEFS.
-- Currently 0 rows — the app evaluates badges client-side (PostGame/BadgeReveal)
-- but does not yet write earned badges back to this table.

CREATE TABLE IF NOT EXISTS player_badges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid        REFERENCES players(id)  ON DELETE CASCADE,
  session_id  uuid        REFERENCES sessions(id) ON DELETE CASCADE,
  badge_id    text        NOT NULL,
  earned_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_badges_player_id_idx  ON player_badges(player_id);
CREATE INDEX IF NOT EXISTS player_badges_session_id_idx ON player_badges(session_id);

-- Enable realtime (already present in supabase_realtime publication)
-- alter publication supabase_realtime add table player_badges;

-- Enable Row-Level Security
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "player_badges_select_all"
  ON player_badges FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "player_badges_insert_anon"
  ON player_badges FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "player_badges_delete_admin"
  ON player_badges FOR DELETE USING (auth.role() = 'authenticated');
