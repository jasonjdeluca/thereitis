-- MMM phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize MMM
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:43:09.262Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('mmm', 'organic growth', 'standard', 1, true, false),
  ('mmm', 'operating margins', 'standard', 1, true, false),
  ('mmm', 'free cash flow', 'standard', 1, true, false),
  ('mmm', 'cash flow conversion', 'standard', 1, true, false),
  ('mmm', 'free cash flow conversion', 'standard', 1, true, false),
  ('mmm', 'supply chain', 'standard', 1, true, false),
  ('mmm', 'organic sales', 'standard', 1, true, false),
  ('mmm', 'organic sales growth', 'standard', 1, true, false),
  ('mmm', 'adjusted operating', 'standard', 1, true, false),
  ('mmm', 'adjusted free cash flow', 'standard', 1, true, false),
  ('mmm', 'safety and industrial', 'standard', 1, true, false),
  ('mmm', 'operating income', 'standard', 1, true, false),
  ('mmm', 'sales growth', 'standard', 1, true, false),
  ('mmm', 'adjusted earnings', 'standard', 1, true, false),
  ('mmm', 'adjusted eps', 'standard', 1, true, false),
  ('mmm', 'consumer electronics', 'standard', 1, true, false),
  ('mmm', 'mid-single digits', 'standard', 1, true, false),
  ('mmm', 'low-single digits', 'standard', 1, true, false),
  ('mmm', 'spending discipline', 'standard', 1, true, false),
  ('mmm', 'health care', 'standard', 1, true, false),
  ('mmm', 'business groups', 'standard', 1, true, false),
  ('mmm', 'margin expansion', 'standard', 1, true, false),
  ('mmm', 'capital structure', 'standard', 1, true, false),
  ('mmm', 'electronics business', 'standard', 1, true, false),
  ('mmm', 'consumer business', 'standard', 1, true, false),
  ('mmm', 'macro environment', 'standard', 1, true, false),
  ('mmm', 'end markets', 'standard', 1, true, false),
  ('mmm', 'industrial adhesives', 'standard', 1, true, false),
  ('mmm', 'electrical markets', 'standard', 1, true, false),
  ('mmm', 'auto oem', 'standard', 1, true, false),
  ('mmm', 'adjusted organic', 'standard', 1, true, false),
  ('mmm', 'safety business', 'standard', 1, true, false),
  ('mmm', 'adhesives and tapes', 'standard', 1, true, false),
  ('mmm', 'first half', 'standard', 1, true, false),
  ('mmm', 'second half', 'standard', 1, true, false),
  ('mmm', 'cash flow', 'standard', 1, true, false),
  ('mmm', 'operational performance', 'standard', 1, true, false),
  ('mmm', 'operational excellence', 'standard', 1, true, false),
  ('mmm', 'investor day', 'standard', 1, true, false),
  ('mmm', 'disposable respirator', 'standard', 1, true, false),
  ('mmm', 'roofing granules', 'standard', 1, true, false),
  ('mmm', 'personal safety', 'standard', 1, true, false),
  ('mmm', 'restructuring charges', 'standard', 1, true, false),
  ('mmm', 'raw material', 'standard', 1, true, false),
  ('mmm', 'product introductions', 'standard', 1, true, false),
  ('mmm', 'commercial excellence', 'standard', 1, true, false),
  ('mmm', 'capital allocation', 'standard', 1, true, false),
  ('mmm', 'medical solutions', 'standard', 1, true, false),
  ('mmm', 'automotive aftermarket', 'standard', 1, true, false),
  ('mmm', 'home improvement', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('mmm', 'In what decade was the company founded?', '1880s', '1900s', '1920s', '1940s', 'b', 'earnings', 'medium', true),
  ('mmm', 'The company began in which original line of business?', 'mining', 'banking', 'textiles', 'oil refining', 'a', 'earnings', 'medium', true),
  ('mmm', 'Which iconic adhesive-note product does the company make?', 'sticky tabs', 'post-it', 'memo dots', 'quick notes', 'b', 'earnings', 'medium', true),
  ('mmm', 'Which transparent tape brand belongs to the company?', 'scotch', 'tartan', 'clear-line', 'glassine', 'a', 'earnings', 'medium', true),
  ('mmm', 'What is the company''s stock ticker?', 'mmm', 'tmm', 'mmc', 'mmg', 'a', 'earnings', 'medium', true),
  ('mmm', 'The ticker is made of how many identical letters?', 'two', 'three', 'four', 'one', 'b', 'earnings', 'medium', true),
  ('mmm', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('mmm', 'Which is one of the company''s reporting segments?', 'safety and industrial', 'media networks', 'cloud services', 'apparel', 'a', 'earnings', 'medium', true),
  ('mmm', 'Which health-care brand belongs to the company?', 'nexcare', 'band-it', 'curefast', 'medingo', 'a', 'earnings', 'medium', true),
  ('mmm', 'The company is headquartered in which state?', 'minnesota', 'california', 'texas', 'florida', 'a', 'earnings', 'medium', true),
  ('mmm', 'The company is broadly known for products in which area?', 'industrial and consumer goods', 'social media', 'air travel', 'fast food', 'a', 'earnings', 'medium', true),
  ('mmm', 'Order of magnitude, how many people does the company employ?', 'about 9 thousand', 'about 90 thousand', 'about 900 thousand', 'about 9 million', 'b', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'mmm')
  WHERE id = 'mmm';
