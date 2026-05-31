-- BA phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize BA
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:43:09.116Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('ba', 'free cash flow', 'standard', 1, true, false),
  ('ba', 'cash flow', 'standard', 1, true, false),
  ('ba', 'development programs', 'standard', 1, true, false),
  ('ba', 'operating margin', 'standard', 1, true, false),
  ('ba', 'higher commercial', 'standard', 1, true, false),
  ('ba', 'billion in orders', 'standard', 1, true, false),
  ('ba', 'supply chain', 'standard', 1, true, false),
  ('ba', 'per month', 'standard', 1, true, false),
  ('ba', 'earnings release', 'standard', 1, true, false),
  ('ba', 'credit facilities', 'standard', 1, true, false),
  ('ba', 'airplanes in inventory', 'standard', 1, true, false),
  ('ba', 'air force', 'standard', 1, true, false),
  ('ba', 'core loss', 'standard', 1, true, false),
  ('ba', 'debt balance', 'standard', 1, true, false),
  ('ba', 'defense business', 'standard', 1, true, false),
  ('ba', 'balance sheet', 'standard', 1, true, false),
  ('ba', 'financial performance', 'standard', 1, true, false),
  ('ba', 'commercial deliveries', 'standard', 1, true, false),
  ('ba', 'production system', 'standard', 1, true, false),
  ('ba', 'defense portfolio', 'standard', 1, true, false),
  ('ba', 'safety quality', 'standard', 1, true, false),
  ('ba', 'revolving credit', 'standard', 1, true, false),
  ('ba', 'net orders', 'standard', 1, true, false),
  ('ba', 'inventory levels', 'standard', 1, true, false),
  ('ba', 'operational performance', 'standard', 1, true, false),
  ('ba', 'flight testing', 'standard', 1, true, false),
  ('ba', 'global services', 'standard', 1, true, false),
  ('ba', 'boeing defense', 'standard', 1, true, false),
  ('ba', 'boeing global', 'standard', 1, true, false),
  ('ba', 'total company', 'standard', 1, true, false),
  ('ba', 'commercial and government', 'standard', 1, true, false),
  ('ba', 'performance levels', 'standard', 1, true, false),
  ('ba', 'commercial market', 'standard', 1, true, false),
  ('ba', 'follow the lead', 'standard', 1, true, false),
  ('ba', 'safety and quality', 'standard', 1, true, false),
  ('ba', 'production rate', 'standard', 1, true, false),
  ('ba', 'commercial airplanes', 'standard', 1, true, false),
  ('ba', 'fixed-price development', 'standard', 1, true, false),
  ('ba', 'first delivery', 'standard', 1, true, false),
  ('ba', 'shadow factory', 'standard', 1, true, false),
  ('ba', 'retiring risk', 'standard', 1, true, false),
  ('ba', 'credit rating', 'standard', 1, true, false),
  ('ba', 'investment grade', 'standard', 1, true, false),
  ('ba', 'core business', 'standard', 1, true, false),
  ('ba', 'markets we serve', 'standard', 1, true, false),
  ('ba', 'government businesses', 'standard', 1, true, false),
  ('ba', 'we''re confident', 'standard', 1, true, false),
  ('ba', 'good progress', 'standard', 1, true, false),
  ('ba', 'flight test', 'standard', 1, true, false),
  ('ba', 'financial results', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('ba', 'In what decade was the company founded?', '1900s', '1910s', '1920s', '1930s', 'b', 'earnings', 'medium', true),
  ('ba', 'The company''s 787 jet is marketed under what name?', 'dreamliner', 'skyliner', 'stratoliner', 'jetliner', 'a', 'earnings', 'medium', true),
  ('ba', 'Which widebody jet is nicknamed the ''jumbo jet''?', 'the 737', 'the 747', 'the 767', 'the 777', 'b', 'earnings', 'medium', true),
  ('ba', 'Besides commercial airplanes, what is its other major segment?', 'defense and space', 'consumer goods', 'pharmaceuticals', 'grocery retail', 'a', 'earnings', 'medium', true),
  ('ba', 'What is the company''s stock ticker symbol?', 'bo', 'ba', 'bn', 'bg', 'b', 'earnings', 'medium', true),
  ('ba', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('ba', 'The single-aisle 737 production target is measured in units per what?', 'day', 'week', 'month', 'year', 'c', 'earnings', 'medium', true),
  ('ba', 'Which jet family is made by this company rather than a rival?', 'the 320', 'the 350', 'the 777', 'the 220', 'c', 'earnings', 'medium', true),
  ('ba', 'Its headquarters sit in which part of the country?', 'the west coast', 'the east coast area', 'the upper midwest', 'the deep south', 'b', 'earnings', 'medium', true),
  ('ba', 'The 777x is an updated version of which jet family?', 'the 737', 'the 747', 'the 777', 'the 787', 'c', 'earnings', 'medium', true),
  ('ba', 'Order of magnitude, how many people does the company employ?', 'about 17 thousand', 'about 170 thousand', 'about 1.7 million', 'about 17 million', 'b', 'earnings', 'medium', true),
  ('ba', 'The company is a major contractor for which sector?', 'defense', 'agriculture', 'hospitality', 'fashion', 'a', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'ba')
  WHERE id = 'ba';
