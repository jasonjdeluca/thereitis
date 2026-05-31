-- CAT phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize CAT
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:34:22.658Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('cat', 'construction industries', 'standard', 1, true, false),
  ('cat', 'resource industries', 'standard', 1, true, false),
  ('cat', 'sales to users', 'standard', 1, true, false),
  ('cat', 'dealer inventory', 'standard', 1, true, false),
  ('cat', 'adjusted operating profit', 'standard', 1, true, false),
  ('cat', 'operating profit', 'standard', 1, true, false),
  ('cat', 'operating profit margin', 'standard', 1, true, false),
  ('cat', 'profit margin', 'standard', 1, true, false),
  ('cat', 'adjusted profit', 'standard', 1, true, false),
  ('cat', 'price realization', 'standard', 1, true, false),
  ('cat', 'favorable price', 'standard', 1, true, false),
  ('cat', 'power generation', 'standard', 1, true, false),
  ('cat', 'reciprocating engines', 'standard', 1, true, false),
  ('cat', 'solar turbines', 'standard', 1, true, false),
  ('cat', 'gas compression', 'standard', 1, true, false),
  ('cat', 'sales volume', 'standard', 1, true, false),
  ('cat', 'manufacturing costs', 'standard', 1, true, false),
  ('cat', 'share repurchases', 'standard', 1, true, false),
  ('cat', 'segment''s margin', 'standard', 1, true, false),
  ('cat', 'restructuring costs', 'standard', 1, true, false),
  ('cat', 'economic conditions', 'standard', 1, true, false),
  ('cat', 'sales and revenues', 'standard', 1, true, false),
  ('cat', 'free cash flow', 'standard', 1, true, false),
  ('cat', 'cash flow', 'standard', 1, true, false),
  ('cat', 'balance sheet', 'standard', 1, true, false),
  ('cat', 'profitable growth', 'standard', 1, true, false),
  ('cat', 'favorable impact', 'standard', 1, true, false),
  ('cat', 'slightly lower', 'standard', 1, true, false),
  ('cat', 'about flat', 'standard', 1, true, false),
  ('cat', 'news release', 'standard', 1, true, false),
  ('cat', 'north america', 'standard', 1, true, false),
  ('cat', 'latin america', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('cat', 'In what decade was the company formed by a merger?', '1900s', '1920s', '1940s', '1960s', 'b', 'earnings', 'medium', true),
  ('cat', 'The company is best known for making what?', 'construction and mining equipment', 'passenger cars', 'smartphones', 'aircraft', 'a', 'earnings', 'medium', true),
  ('cat', 'What color are the company''s machines famously painted?', 'yellow', 'red', 'green', 'blue', 'a', 'earnings', 'medium', true),
  ('cat', 'What is the company''s stock ticker?', 'ct', 'cat', 'ctp', 'catr', 'b', 'earnings', 'medium', true),
  ('cat', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('cat', 'Which is one of the company''s reporting segments?', 'construction industries', 'media networks', 'cloud services', 'footwear', 'a', 'earnings', 'medium', true),
  ('cat', 'The company sells engines and turbines under which energy brand?', 'solar turbines', 'wind dynamics', 'hydroflow', 'voltedge', 'a', 'earnings', 'medium', true),
  ('cat', 'Independent dealers are a key part of the company''s what?', 'distribution network', 'ad agency', 'airline', 'retail bank', 'a', 'earnings', 'medium', true),
  ('cat', 'The company is headquartered in which state?', 'illinois', 'ohio', 'nevada', 'maine', 'a', 'earnings', 'medium', true),
  ('cat', 'Digging and hauling machinery falls under which segment theme?', 'resource industries', 'consumer health', 'streaming', 'insurance', 'a', 'earnings', 'medium', true),
  ('cat', 'The company''s products are commonly used in which sectors?', 'construction and mining', 'social media', 'air travel', 'pharma', 'a', 'earnings', 'medium', true),
  ('cat', 'Order of magnitude, how many people does the company employ?', 'about 11 thousand', 'about 110 thousand', 'about 1.1 million', 'about 11 million', 'b', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'cat')
  WHERE id = 'cat';
