-- MRK phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize MRK
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-05-31T18:34:22.995Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('mrk', 'animal health', 'standard', 1, true, false),
  ('mrk', 'animal health business', 'standard', 1, true, false),
  ('mrk', 'business development', 'standard', 1, true, false),
  ('mrk', 'renal cell carcinoma', 'standard', 1, true, false),
  ('mrk', 'cell carcinoma', 'standard', 1, true, false),
  ('mrk', 'foreign exchange', 'standard', 1, true, false),
  ('mrk', 'operating expenses', 'standard', 1, true, false),
  ('mrk', 'gross margin', 'standard', 1, true, false),
  ('mrk', 'gross margin assumption', 'standard', 1, true, false),
  ('mrk', 'key growth', 'standard', 1, true, false),
  ('mrk', 'pulmonary arterial', 'standard', 1, true, false),
  ('mrk', 'certain patients', 'standard', 1, true, false),
  ('mrk', 'global demand', 'standard', 1, true, false),
  ('mrk', 'prioritize investments', 'standard', 1, true, false),
  ('mrk', 'gaap results', 'standard', 1, true, false),
  ('mrk', 'previously treated', 'standard', 1, true, false),
  ('mrk', 'tax rate', 'standard', 1, true, false),
  ('mrk', 'underlying assumptions', 'standard', 1, true, false),
  ('mrk', 'near- and long-term', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('mrk', 'The company primarily operates in which industry?', 'pharmaceuticals', 'airlines', 'paint', 'mining', 'a', 'earnings', 'medium', true),
  ('mrk', 'What is the company''s stock ticker?', 'mk', 'mrk', 'mck', 'mer', 'b', 'earnings', 'medium', true),
  ('mrk', 'The company is a component of which index?', 'the dow 30', 'the russell 2000', 'a crypto index', 'no major index', 'a', 'earnings', 'medium', true),
  ('mrk', 'Which blockbuster cancer immunotherapy does the company make?', 'keytruda', 'humira', 'eliquis', 'ozempic', 'a', 'earnings', 'medium', true),
  ('mrk', 'Which vaccine for a common virus is one of its products?', 'gardasil', 'shingrix', 'prevnar', 'fluzone', 'a', 'earnings', 'medium', true),
  ('mrk', 'Besides human pharma, the company has a large business in what?', 'animal health', 'air travel', 'home paint', 'social media', 'a', 'earnings', 'medium', true),
  ('mrk', 'In many markets the company is branded under which name?', 'msd', 'gsk', 'bms', 'lly', 'a', 'earnings', 'medium', true),
  ('mrk', 'The company''s products are mainly what?', 'prescription medicines and vaccines', 'snack foods', 'tractors', 'house paint', 'a', 'earnings', 'medium', true),
  ('mrk', '''Renal cell carcinoma'' treated by its drugs is a type of what?', 'cancer', 'allergy', 'fracture', 'head cold', 'a', 'earnings', 'medium', true),
  ('mrk', 'The company is headquartered in which state?', 'new jersey', 'texas', 'oregon', 'nevada', 'a', 'earnings', 'medium', true),
  ('mrk', 'Which therapeutic area is a major focus for the company?', 'oncology', 'smartphones', 'aviation', 'retail', 'a', 'earnings', 'medium', true),
  ('mrk', '''Pulmonary arterial'' hypertension chiefly affects which system?', 'the lungs and heart', 'the skin', 'the teeth', 'the hair', 'a', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'mrk')
  WHERE id = 'mrk';
