-- ============================================================
-- Sprint 5: Create private documents storage bucket + RLS
-- ============================================================
-- DO NOT RUN — Samira runs manually in Supabase dashboard.
-- PREREQUISITE: Sprint 3 migrations must be applied first.
-- ============================================================

-- Create private documents bucket (50 MB limit, PDF + images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their org folder only
DROP POLICY IF EXISTS "org_upload_policy" ON storage.objects;
CREATE POLICY "org_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.users WHERE id = auth.uid()
    )
  );

-- RLS: authenticated users can read their org files only
DROP POLICY IF EXISTS "org_read_policy" ON storage.objects;
CREATE POLICY "org_read_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.users WHERE id = auth.uid()
    )
  );

-- RLS: authenticated users can delete their org files only
DROP POLICY IF EXISTS "org_delete_policy" ON storage.objects;
CREATE POLICY "org_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.users WHERE id = auth.uid()
    )
  );
