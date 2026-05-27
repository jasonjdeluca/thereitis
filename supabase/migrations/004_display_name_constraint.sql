-- Enforce max display name length at the database level.
-- Applied 2026-05-27.

ALTER TABLE players
  ADD CONSTRAINT display_name_max_length
  CHECK (char_length(display_name) <= 30);
