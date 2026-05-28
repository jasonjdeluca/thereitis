-- Activate Coca-Cola as second company alongside Hilton.
-- Emoji collision between Citigroup (🏦) and JPMorgan Chase (🏦) resolved:
--   Citigroup reassigned 🏛️ in companies.json (not yet in DB — will apply on ingest).
--   JPMorgan Chase retains 🏦.

INSERT INTO companies (id, name, emoji, is_active, phrase_count, total_sessions)
VALUES ('ko', 'Coca-Cola', '🥤', true, 0, 0)
ON CONFLICT (id) DO NOTHING;
