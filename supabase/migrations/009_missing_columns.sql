-- Retroactive migration: these columns already exist in the live DB.
-- This file documents schema additions for version control purposes.
-- Do NOT re-run against a live DB without checking for existence first.

-- sessions.winner_phrase
-- Written by WordOfTheCall after the post-game voting round resolves.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS winner_phrase text;

-- players.predictions
-- Stores up to 3 pre-call phrase picks made in the Predictions screen.
-- Used to award bonus points and the Psychic badge.
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS predictions jsonb DEFAULT '[]';

-- ────────────────────────────────────────────────────────────────
-- RESOLVED: sessions.started_at (not created_at)
-- Fixed: session.js:59, Lobby.jsx:24+29 (expiry check), Admin.jsx:143
-- (sessions 24h filter) all updated to use started_at.
-- ────────────────────────────────────────────────────────────────

-- RESOLVED: marks.marked_at (not created_at)
-- Fixed: Game.jsx:151+152 — mark.created_at fallback replaced with
-- mark.marked_at; now uses the actual DB timestamp instead of always
-- falling back to current time.
-- ────────────────────────────────────────────────────────────────
