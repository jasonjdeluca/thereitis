-- Restrict anonymous game-state writes to active sessions and valid player/session pairs.

DROP POLICY IF EXISTS players_update_own ON players;
CREATE POLICY players_update_own ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = players.session_id
        AND sessions.status = 'active'
    )
  );

REVOKE UPDATE ON players FROM anon;
GRANT UPDATE (score, marked_squares, bingo_count, blackout, predictions)
  ON players TO anon;

DROP POLICY IF EXISTS sessions_update_anon ON sessions;
CREATE POLICY sessions_update_anon ON sessions
  FOR UPDATE
  USING (status = 'active')
  WITH CHECK (status IN ('active', 'ended'));

DROP POLICY IF EXISTS marks_insert_anon ON marks;
CREATE POLICY marks_insert_anon ON marks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM players
      WHERE players.id = marks.player_id
        AND players.session_id = marks.session_id
    )
  );

ALTER TABLE sessions ALTER COLUMN company_id DROP DEFAULT;
