-- 014_add_missing_companies.sql
-- Adds the 12 researched companies not yet present in the companies table:
-- 9 blue-chip (BA, CAT, HD, HON, MCD, MMM, NKE, SHW, WMT) +
-- 3 hospitality REITs (RHP, CLDT, AHT).
-- All inserted as is_active = false — activation requires 50+ approved phrases.

INSERT INTO companies (id, name, emoji, is_active) VALUES
  ('ba',   'Boeing',               '✈️',  false),
  ('cat',  'Caterpillar',          '🚜',  false),
  ('hd',   'Home Depot',           '🔨',  false),
  ('hon',  'Honeywell',            '⚙️',  false),
  ('mcd',  'McDonald''s',          '🍔',  false),
  ('mmm',  '3M',                   '🩹',  false),
  ('nke',  'Nike',                 '👟',  false),
  ('shw',  'Sherwin-Williams',     '🎨',  false),
  ('wmt',  'Walmart',              '🛒',  false),
  ('rhp',  'Ryman Hospitality',    '🎶',  false),
  ('cldt', 'Chatham Lodging',      '🏨',  false),
  ('aht',  'Ashford Hospitality',  '🏨',  false)
ON CONFLICT (id) DO NOTHING;
