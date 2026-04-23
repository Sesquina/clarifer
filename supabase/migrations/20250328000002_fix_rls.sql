-- ============================================
-- Fix table permissions and RLS policies
-- for all Clarifer tables
-- ============================================

-- 1. GRANT table privileges to authenticated and anon roles
-- (Required for PostgREST / Supabase client to access tables)

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trial_saves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

-- Grant sequence usage for auto-increment columns
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Enable RLS on all tables

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies to start clean

DO $$
DECLARE
  _tbl text;
  _pol record;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY[
    'patients','users','care_relationships','chat_messages',
    'documents','symptom_logs','medications','notifications',
    'trial_saves','appointments'
  ])
  LOOP
    FOR _pol IN
      SELECT policyname FROM pg_policies WHERE tablename = _tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- 4. Create RLS policies for each table

-- == patients ==
CREATE POLICY "patients_select" ON public.patients
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "patients_insert" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "patients_update" ON public.patients
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "patients_delete" ON public.patients
  FOR DELETE USING (auth.uid() = created_by);

-- == users ==
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- == care_relationships ==
CREATE POLICY "care_relationships_select" ON public.care_relationships
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "care_relationships_insert" ON public.care_relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "care_relationships_update" ON public.care_relationships
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "care_relationships_delete" ON public.care_relationships
  FOR DELETE USING (auth.uid() = user_id);

-- == chat_messages (via patient ownership) ==
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = chat_messages.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = chat_messages.patient_id AND patients.created_by = auth.uid())
  );

-- == documents (via patient ownership) ==
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = documents.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = documents.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = documents.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = documents.patient_id AND patients.created_by = auth.uid())
  );

-- == symptom_logs (via patient ownership) ==
CREATE POLICY "symptom_logs_select" ON public.symptom_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = symptom_logs.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "symptom_logs_insert" ON public.symptom_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = symptom_logs.patient_id AND patients.created_by = auth.uid())
  );

-- == medications (via patient ownership) ==
CREATE POLICY "medications_select" ON public.medications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = medications.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "medications_insert" ON public.medications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = medications.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "medications_update" ON public.medications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = medications.patient_id AND patients.created_by = auth.uid())
  );

-- == notifications ==
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- == trial_saves (owned via saved_by) ==
CREATE POLICY "trial_saves_select" ON public.trial_saves
  FOR SELECT USING (auth.uid() = saved_by);
CREATE POLICY "trial_saves_insert" ON public.trial_saves
  FOR INSERT WITH CHECK (auth.uid() = saved_by);
CREATE POLICY "trial_saves_delete" ON public.trial_saves
  FOR DELETE USING (auth.uid() = saved_by);

-- == appointments (via patient ownership) ==
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.created_by = auth.uid())
  );
CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.created_by = auth.uid())
  );
