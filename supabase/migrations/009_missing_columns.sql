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
-- KNOWN BUG: sessions has no created_at column (only started_at).
-- Code in src/lib/session.js and src/components/Lobby.jsx references
-- session.created_at for the 6-hour expiry check, which will always
-- be undefined. The expiry check silently fails (NaN > threshold = false).
-- Fix: update those code paths to use started_at instead of created_at.
-- ────────────────────────────────────────────────────────────────

-- KNOWN BUG: marks has no created_at column (only marked_at).
-- Code in Game.jsx uses mark.created_at || new Date().toISOString()
-- which always falls back to the current time — harmless but imprecise.
-- ────────────────────────────────────────────────────────────────
