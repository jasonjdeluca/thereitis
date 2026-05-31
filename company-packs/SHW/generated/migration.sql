-- SHW phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize SHW
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:34:22.769Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('shw', 'paint stores group', 'standard', 1, true, false),
  ('shw', 'residential repaint', 'standard', 1, true, false),
  ('shw', 'general industrial', 'standard', 1, true, false),
  ('shw', 'performance coatings', 'standard', 1, true, false),
  ('shw', 'consumer brands group', 'standard', 1, true, false),
  ('shw', 'segment margin', 'standard', 1, true, false),
  ('shw', 'adjusted segment margin', 'standard', 1, true, false),
  ('shw', 'auto refinish', 'standard', 1, true, false),
  ('shw', 'industrial wood', 'standard', 1, true, false),
  ('shw', 'consolidated sales', 'standard', 1, true, false),
  ('shw', 'segment sales', 'standard', 1, true, false),
  ('shw', 'demand environment', 'standard', 1, true, false),
  ('shw', 'price mix', 'standard', 1, true, false),
  ('shw', 'end markets', 'standard', 1, true, false),
  ('shw', 'paint stores', 'standard', 1, true, false),
  ('shw', 'sales increased', 'standard', 1, true, false),
  ('shw', 'success by design', 'standard', 1, true, false),
  ('shw', 'second half', 'standard', 1, true, false),
  ('shw', 'third quarter', 'standard', 1, true, false),
  ('shw', 'north america', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('shw', 'In what decade was the company founded?', '1840s', '1860s', '1890s', '1910s', 'b', 'earnings', 'medium', true),
  ('shw', 'The company primarily makes what products?', 'paints and coatings', 'kitchen appliances', 'tires', 'smartphones', 'a', 'earnings', 'medium', true),
  ('shw', 'The company''s classic logo shows paint covering what?', 'the earth', 'a single house', 'a sports car', 'an artist''s canvas', 'a', 'earnings', 'medium', true),
  ('shw', 'What is the company''s stock ticker?', 'sw', 'shw', 'swn', 'shn', 'b', 'earnings', 'medium', true),
  ('shw', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('shw', 'Which is one of the company''s reporting segments?', 'paint stores group', 'media networks', 'cloud services', 'airlines', 'a', 'earnings', 'medium', true),
  ('shw', 'Professional paint is sold largely through what channel?', 'its own stores', 'vending machines', 'gas stations', 'airlines', 'a', 'earnings', 'medium', true),
  ('shw', 'In 2017 the company acquired which coatings maker?', 'valspar', 'benjamin only', 'dulux', 'behr', 'a', 'earnings', 'medium', true),
  ('shw', 'The company is headquartered in which state?', 'ohio', 'texas', 'oregon', 'georgia', 'a', 'earnings', 'medium', true),
  ('shw', 'The term ''residential repaint'' refers to demand from what?', 'home repainting', 'new aircraft', 'data centers', 'oil rigs', 'a', 'earnings', 'medium', true),
  ('shw', 'Which segment serves manufacturers and industrial uses?', 'performance coatings', 'streaming media', 'retail banking', 'air travel', 'a', 'earnings', 'medium', true),
  ('shw', 'The company''s products are mainly used for what?', 'architectural and industrial coating', 'mobile gaming', 'air travel', 'food delivery', 'a', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'shw')
  WHERE id = 'shw';
