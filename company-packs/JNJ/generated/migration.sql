-- JNJ phrase and trivia migration
-- Finalized by scripts/ingestion/process-review-queue.js --finalize JNJ
-- Phrases selected by a Claude Code agent (subscription), not an API call.
-- 2026-06-01T21:27:44.480Z
--
-- HUMAN REVIEW REQUIRED before execution.
-- Phrases are inserted with is_active = false; activate after review.

INSERT INTO phrases (company_id, phrase, tier, points, ceo_mode, is_active) VALUES
  ('jnj', 'above-market growth', 'standard', 1, true, false),
  ('jnj', 'loss of exclusivity', 'standard', 1, true, false),
  ('jnj', 'innovative pipeline', 'standard', 1, true, false),
  ('jnj', 'commercial execution', 'standard', 1, true, false),
  ('jnj', 'differentiated solutions', 'standard', 1, true, false),
  ('jnj', 'volume-based procurement', 'standard', 1, true, false),
  ('jnj', 'pulsed field ablation', 'standard', 1, true, false),
  ('jnj', 'remains underappreciated', 'standard', 1, true, false),
  ('jnj', 'transformational medicine', 'standard', 1, true, false),
  ('jnj', 'innovative medicine', 'standard', 1, true, false),
  ('jnj', 'disease-centric', 'standard', 1, true, false),
  ('jnj', 'organic and inorganic', 'standard', 1, true, false),
  ('jnj', 'thoughtful and phased', 'standard', 1, true, false),
  ('jnj', 'kenvue', 'standard', 1, true, false),
  ('jnj', 'competitive growth', 'standard', 1, true, false),
  ('jnj', 'our robust pipeline', 'standard', 1, true, false),
  ('jnj', 'near-term success', 'standard', 1, true, false),
  ('jnj', 'long-term growth', 'standard', 1, true, false),
  ('jnj', 'capital allocation', 'standard', 1, true, false),
  ('jnj', 'value creation', 'standard', 1, true, false),
  ('jnj', 'well positioned', 'standard', 1, true, false),
  ('jnj', 'unwavering commitment', 'standard', 1, true, false),
  ('jnj', 'important catalysts', 'standard', 1, true, false),
  ('jnj', 'proactive management', 'standard', 1, true, false),
  ('jnj', 'medtech', 'standard', 1, true, false),
  ('jnj', 'electrophysiology', 'standard', 1, true, false),
  ('jnj', 'market-leading', 'standard', 1, true, false),
  ('jnj', 'enhance patient care', 'standard', 1, true, false),
  ('jnj', 'our strong dividend', 'standard', 1, true, false),
  ('jnj', 'share repurchase', 'standard', 1, true, false),
  ('jnj', 'agile and focused', 'standard', 1, true, false),
  ('jnj', 'on track to complete', 'standard', 1, true, false),
  ('jnj', 'double-digit growth', 'standard', 1, true, false),
  ('jnj', 'newly launched products', 'standard', 1, true, false),
  ('jnj', 'healthcare outcomes', 'standard', 1, true, false),
  ('jnj', 'positive top line results', 'standard', 1, true, false),
  ('jnj', 'pipeline assets', 'standard', 1, true, false),
  ('jnj', 'commercial uptake', 'standard', 1, true, false),
  ('jnj', 'above-market compounded', 'standard', 1, true, false),
  ('jnj', 'excluding special items', 'standard', 1, true, false),
  ('jnj', 'pharmaceutical segment', 'standard', 1, true, false),
  ('jnj', 'focused and competitive', 'standard', 1, true, false),
  ('jnj', 'consumer health', 'standard', 1, true, false),
  ('jnj', 'invest strategically', 'standard', 1, true, false),
  ('jnj', 'we remain on track', 'standard', 1, true, false)
ON CONFLICT (company_id, phrase) DO NOTHING;

INSERT INTO trivia_questions (company_id, question, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, is_active) VALUES
  ('jnj', 'What was the name of the company''s consumer health spinoff that launched as a standalone public company in 2023?', 'kenvue', 'healthex', 'meditrel', 'carivia', 'a', 'earnings', 'medium', true),
  ('jnj', 'How many consecutive years of annual dividend increases did the company celebrate in Q1 2023?', '25', '40', '61', '75', 'c', 'earnings', 'medium', true),
  ('jnj', 'After acquiring Abiomed, how many MedTech platforms did the company report had over $1 billion in annual sales?', '8', '12', '16', '20', 'b', 'earnings', 'medium', true),
  ('jnj', 'What was the present value of the company''s proposed talc litigation settlement announced in 2023?', '$3.1 billion', '$6.9 billion', '$8.9 billion', '$12.4 billion', 'c', 'earnings', 'medium', true),
  ('jnj', 'What type of therapy is CARVYKTI, the company''s oncology treatment approved for multiple myeloma?', 'mRNA vaccine', 'CAR-T cell therapy', 'antibody-drug conjugate', 'small molecule inhibitor', 'b', 'earnings', 'medium', true),
  ('jnj', 'After separating its consumer health business, the remaining company comprises which two business segments?', 'pharma and consumer', 'medtech and consumer', 'pharma and medtech', 'diagnostics and devices', 'c', 'earnings', 'medium', true),
  ('jnj', 'What was the name of the company''s investigational robotic surgery platform highlighted in its 2023 earnings calls?', 'Velaris', 'OTTAVA', 'ProSurge', 'Apex', 'b', 'earnings', 'medium', true),
  ('jnj', 'Approximately what percentage of sales did the company invest in research and development in Q1 2023?', '8.2%', '10.7%', '14.4%', '18.1%', 'c', 'earnings', 'medium', true),
  ('jnj', 'In which country did the company report patient utilization of Abiomed technologies grew over 30%?', 'china', 'germany', 'japan', 'brazil', 'c', 'earnings', 'medium', true),
  ('jnj', 'What term describes a company that has raised its annual dividend for 50 or more consecutive years?', 'dividend champion', 'dividend king', 'dividend aristocrat', 'dividend elite', 'b', 'earnings', 'medium', true),
  ('jnj', 'What disease was the CARTITUDE-4 phase III clinical study designed to treat?', 'lung cancer', 'multiple myeloma', 'rheumatoid arthritis', 'colorectal cancer', 'b', 'earnings', 'medium', true),
  ('jnj', 'Over how many years did the company propose to spread its talc litigation settlement payments?', '10 years', '25 years', '40 years', '50 years', 'b', 'earnings', 'medium', true),
  ('jnj', 'What was the company''s approximate target for pharmaceutical segment sales by 2025, discussed in early 2023?', '$40 billion', '$47 billion', '$54 billion', '$61 billion', 'c', 'earnings', 'medium', true),
  ('jnj', 'Which electrophysiology clinical study did the company report had met both primary safety and efficacy endpoints?', 'SmartfiRE', 'FlexPulse', 'inspiRE', 'ProPath', 'c', 'earnings', 'medium', true)
ON CONFLICT DO NOTHING;

UPDATE companies
  SET phrase_count = (SELECT COUNT(*) FROM phrases WHERE company_id = 'jnj')
  WHERE id = 'jnj';
