-- JPM phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize JPM
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:34:22.878Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('jpm', 'net inflows', 'standard', 1, true, false),
  ('jpm', 'net income', 'standard', 1, true, false),
  ('jpm', 'reported net income', 'standard', 1, true, false),
  ('jpm', 'balance sheet', 'standard', 1, true, false),
  ('jpm', 'nii ex markets', 'standard', 1, true, false),
  ('jpm', 'management fees', 'standard', 1, true, false),
  ('jpm', 'reserve build', 'standard', 1, true, false),
  ('jpm', 'net reserve build', 'standard', 1, true, false),
  ('jpm', 'ib fees', 'standard', 1, true, false),
  ('jpm', 'market levels', 'standard', 1, true, false),
  ('jpm', 'average market levels', 'standard', 1, true, false),
  ('jpm', 'pre-tax margin', 'standard', 1, true, false),
  ('jpm', 'wealth management', 'standard', 1, true, false),
  ('jpm', 'asset wealth management', 'standard', 1, true, false),
  ('jpm', 'asset management', 'standard', 1, true, false),
  ('jpm', 'net charge-offs', 'standard', 1, true, false),
  ('jpm', 'credit costs', 'standard', 1, true, false),
  ('jpm', 'fixed income', 'standard', 1, true, false),
  ('jpm', 'investment banking', 'standard', 1, true, false),
  ('jpm', 'client assets', 'standard', 1, true, false),
  ('jpm', 'markets revenue', 'standard', 1, true, false),
  ('jpm', 'capital distributions', 'standard', 1, true, false),
  ('jpm', 'securities losses', 'standard', 1, true, false),
  ('jpm', 'revolving balances', 'standard', 1, true, false),
  ('jpm', 'higher revolving balances', 'standard', 1, true, false),
  ('jpm', 'adjusted expense', 'standard', 1, true, false),
  ('jpm', 'higher nii', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('jpm', 'The company is primarily what type of business?', 'a bank', 'an airline', 'a carmaker', 'a grocer', 'a', 'earnings', 'medium', true),
  ('jpm', 'It is often cited as the largest US bank by what measure?', 'assets', 'store count', 'aircraft', 'oil reserves', 'a', 'earnings', 'medium', true),
  ('jpm', 'What is the company''s stock ticker?', 'jp', 'jpm', 'jpc', 'jmp', 'b', 'earnings', 'medium', true),
  ('jpm', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('jpm', 'Which is one of the company''s business segments?', 'consumer and community banking', 'jet manufacturing', 'paint coatings', 'soft drinks', 'a', 'earnings', 'medium', true),
  ('jpm', 'Investment-banking fees sit within which broad activity?', 'the corporate and investment bank', 'fast food', 'mining', 'airlines', 'a', 'earnings', 'medium', true),
  ('jpm', 'The company is headquartered in which city?', 'new york city', 'chicago', 'denver', 'miami', 'a', 'earnings', 'medium', true),
  ('jpm', 'Wealth management falls under which segment?', 'asset and wealth management', 'defense', 'retail apparel', 'streaming', 'a', 'earnings', 'medium', true),
  ('jpm', 'A bank ''reserve build'' sets aside money for what?', 'potential loan losses', 'new stores', 'aircraft orders', 'ad campaigns', 'a', 'earnings', 'medium', true),
  ('jpm', 'Which is a core banking activity for the company?', 'lending and deposits', 'making films', 'brewing soda', 'mining coal', 'a', 'earnings', 'medium', true),
  ('jpm', 'The company serves which broad customer base?', 'consumers and corporations', 'only farmers', 'only airlines', 'only sports teams', 'a', 'earnings', 'medium', true),
  ('jpm', 'Order of magnitude, how many people does the company employ?', 'about 30 thousand', 'about 300 thousand', 'about 3 million', 'about 30 million', 'b', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'jpm')
  WHERE id = 'jpm';
