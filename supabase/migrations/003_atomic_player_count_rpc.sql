-- Atomic player count increment to avoid race conditions on simultaneous joins.
-- Applied 2026-05-27.

CREATE OR REPLACE FUNCTION increment_player_count(session_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE sessions
  SET player_count = player_count + 1
  WHERE id = session_id;
$$;
