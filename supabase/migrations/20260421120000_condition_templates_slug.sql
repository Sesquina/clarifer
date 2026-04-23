-- Fix: production condition_templates.id is UUID, but existing migrations
-- (dementia, alzheimers, cholangiocarcinoma) INSERT text slugs into that column,
-- which makes `supabase db push` fail. Adds a dedicated slug column + unique
-- constraint so templates can be upserted idempotently by slug while the
-- primary key stays a UUID.
--
-- Timestamped 20260421120000 so it runs BEFORE the 20260422* template inserts.
-- DO NOT EXECUTE manually — apply via `npx supabase db push`.

ALTER TABLE public.condition_templates
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs on the 5 existing production rows (idempotent: only writes if still NULL).
UPDATE public.condition_templates
SET slug = 'cholangiocarcinoma'
WHERE id = 'ab7ded51-685c-4f5b-aa7e-b7f776d218ed' AND slug IS NULL;

UPDATE public.condition_templates
SET slug = 'dementia'
WHERE id = 'c0297dcb-5e17-42aa-9f8d-129c7a580f08' AND slug IS NULL;

UPDATE public.condition_templates
SET slug = 'general'
WHERE id = '998d060b-e779-4fcc-8138-b5f70596dcfe' AND slug IS NULL;

UPDATE public.condition_templates
SET slug = 'general-oncology'
WHERE id = 'cc87ee9e-42fc-445d-819f-bd94831524c7' AND slug IS NULL;

UPDATE public.condition_templates
SET slug = 'stroke-recovery'
WHERE id = 'fadb1c0a-de31-4c54-b9dd-727528723ade' AND slug IS NULL;

-- Enforce uniqueness + fast lookup.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'condition_templates_slug_key'
  ) THEN
    ALTER TABLE public.condition_templates
      ADD CONSTRAINT condition_templates_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_condition_templates_slug
  ON public.condition_templates(slug);
