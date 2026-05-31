-- KO phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize KO
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:43:09.387Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('ko', 'revenue growth', 'standard', 1, true, false),
  ('ko', 'organic revenue growth', 'standard', 1, true, false),
  ('ko', 'organic revenue', 'standard', 1, true, false),
  ('ko', 'volume growth', 'standard', 1, true, false),
  ('ko', 'comparable earnings', 'standard', 1, true, false),
  ('ko', 'share growth', 'standard', 1, true, false),
  ('ko', 'value share', 'standard', 1, true, false),
  ('ko', 'price mix', 'standard', 1, true, false),
  ('ko', 'gross margin', 'standard', 1, true, false),
  ('ko', 'comparable gross margin', 'standard', 1, true, false),
  ('ko', 'operating margin', 'standard', 1, true, false),
  ('ko', 'comparable operating', 'standard', 1, true, false),
  ('ko', 'top line', 'standard', 1, true, false),
  ('ko', 'top line growth', 'standard', 1, true, false),
  ('ko', 'unit cases', 'standard', 1, true, false),
  ('ko', 'concentrate sales', 'standard', 1, true, false),
  ('ko', 'pricing actions', 'standard', 1, true, false),
  ('ko', 'net debt', 'standard', 1, true, false),
  ('ko', 'net debt leverage', 'standard', 1, true, false),
  ('ko', 'effective tax rate', 'standard', 1, true, false),
  ('ko', 'currency headwind', 'standard', 1, true, false),
  ('ko', 'hedge positions', 'standard', 1, true, false),
  ('ko', 'mix growth', 'standard', 1, true, false),
  ('ko', 'comparable net revenues', 'standard', 1, true, false),
  ('ko', 'headwind to comparable', 'standard', 1, true, false),
  ('ko', 'grew organic', 'standard', 1, true, false),
  ('ko', 'free cash flow', 'standard', 1, true, false),
  ('ko', 'cash flow', 'standard', 1, true, false),
  ('ko', 'balance sheet', 'standard', 1, true, false),
  ('ko', 'full year', 'standard', 1, true, false),
  ('ko', 'north america', 'standard', 1, true, false),
  ('ko', 'latin america', 'standard', 1, true, false),
  ('ko', 'middle east', 'standard', 1, true, false),
  ('ko', 'investors section', 'standard', 1, true, false),
  ('ko', 'earnings release', 'standard', 1, true, false),
  ('ko', 'comparable eps', 'standard', 1, true, false),
  ('ko', 'revenue growth management', 'standard', 1, true, false),
  ('ko', 'long-term growth', 'standard', 1, true, false),
  ('ko', 'capital allocation', 'standard', 1, true, false),
  ('ko', 'times ebitda', 'standard', 1, true, false),
  ('ko', 'all-weather strategy', 'standard', 1, true, false),
  ('ko', 'total beverage', 'standard', 1, true, false),
  ('ko', 'cash flow generation', 'standard', 1, true, false),
  ('ko', 'volume and value share', 'standard', 1, true, false),
  ('ko', 'operating environment', 'standard', 1, true, false),
  ('ko', 'share gains', 'standard', 1, true, false),
  ('ko', 'price points', 'standard', 1, true, false),
  ('ko', 'grew volume', 'standard', 1, true, false),
  ('ko', 'underlying effective tax', 'standard', 1, true, false),
  ('ko', 'financial information', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('ko', 'In what decade was the beverage first created?', '1860s', '1880s', '1900s', '1920s', 'b', 'earnings', 'medium', true),
  ('ko', 'The drink was originally sold at what kind of location?', 'a pharmacy', 'a bakery', 'a hardware store', 'a gas station', 'a', 'earnings', 'medium', true),
  ('ko', 'What is the company''s stock ticker?', 'co', 'ko', 'cc', 'ck', 'b', 'earnings', 'medium', true),
  ('ko', 'Which lemon-lime soft drink does the company own?', 'sprite', 'sierra', 'citra', 'twist', 'a', 'earnings', 'medium', true),
  ('ko', 'Which orange soda brand belongs to the company?', 'fanta', 'crush', 'tango', 'jolt', 'a', 'earnings', 'medium', true),
  ('ko', 'Which bottled water brand does the company own?', 'dasani', 'aquafina', 'perrier', 'evian', 'a', 'earnings', 'medium', true),
  ('ko', 'The company mainly sells what to its bottling partners?', 'concentrate', 'glass bottles', 'delivery trucks', 'retail shelving', 'a', 'earnings', 'medium', true),
  ('ko', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('ko', 'The company is headquartered in which city?', 'atlanta', 'chicago', 'denver', 'boston', 'a', 'earnings', 'medium', true),
  ('ko', 'How does the company describe its beverage strategy?', 'a total beverage company', 'an energy-only company', 'a dairy-first company', 'an alcohol-led company', 'a', 'earnings', 'medium', true),
  ('ko', 'Which sports-drink brand does the company control?', 'powerade', 'gatorade', 'bodyfuel', 'lucozade', 'a', 'earnings', 'medium', true),
  ('ko', 'Order of magnitude, in how many countries are its products sold?', 'about 20', 'about 200', 'about 2,000', 'about 20,000', 'b', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'ko')
  WHERE id = 'ko';
