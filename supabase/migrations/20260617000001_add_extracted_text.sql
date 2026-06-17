-- Adds extracted_text to documents for fast streaming analysis.
-- The upload route extracts PDF text at upload time and stores it here.
-- The summarize route reads this column to stream tokens without re-downloading the file.
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
