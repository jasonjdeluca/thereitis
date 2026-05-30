-- 015_latest_ingested_quarter.sql
-- Adds latest_ingested_quarter to the companies table.
-- Used by Group H transcript-freshness.js to detect stale coverage.
-- Format: "Q1 2026" (calendar quarter, not fiscal). Written by the ops-worker
-- after each successful Stage 5 completion for a company.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS latest_ingested_quarter text;

COMMENT ON COLUMN companies.latest_ingested_quarter IS
  'Most recent earnings call quarter ingested for this company. Format: "Q1 2026". '
  'Written by ops-worker/validator after Stage 5 success. Used by transcript-freshness.js.';
