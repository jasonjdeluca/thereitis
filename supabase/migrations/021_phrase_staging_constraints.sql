ALTER TABLE phrase_staging
  ADD CONSTRAINT phrase_staging_length_check
  CHECK (LENGTH(phrase) <= 25);
