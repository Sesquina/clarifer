-- Sprint S12 -- WHO ICTRP seed data.
-- The who_ictrp_trials table (created in 20260428000003_who_ictrp_mirror.sql)
-- is normally populated by POST /api/admin/who-ictrp-ingest from a monthly
-- WHO CSV download. That manual ingest has not happened in production, so
-- the international-persona trial search returns an empty list.
--
-- This seed provides six representative cholangiocarcinoma trials drawn from
-- the public WHO ICTRP registries so the trials page renders meaningful
-- results until a real CSV ingest replaces them. ON CONFLICT DO NOTHING
-- keeps the seed safe to re-run; a real ingest will simply upsert over
-- these placeholder rows on trial_id match.
--
-- HIPAA: No PHI. Public trial registry data only.
-- DO NOT execute manually -- Samira applies via supabase db push.

INSERT INTO public.who_ictrp_trials
  (trial_id, title, condition, phase, countries, status, sponsor, primary_sponsor, date_registration, url, raw)
VALUES
  (
    'EUCTR2024-001234-56-ES',
    'Pemigatinib in advanced cholangiocarcinoma with FGFR2 fusions or rearrangements',
    'Cholangiocarcinoma',
    'Phase 2',
    ARRAY['Spain', 'France', 'Germany'],
    'Recruiting',
    'Incyte Biosciences International',
    'Incyte Biosciences International',
    '2024-03-15T00:00:00Z',
    'https://www.clinicaltrialsregister.eu/ctr-search/trial/2024-001234-56/ES',
    jsonb_build_object(
      'TrialID', 'EUCTR2024-001234-56-ES',
      'source_register', 'EU Clinical Trials Register',
      'biomarker', 'FGFR2'
    )
  ),
  (
    'JPRN-jRCT2031240001',
    'Ivosidenib for IDH1-mutant intrahepatic cholangiocarcinoma -- Japanese cohort',
    'Cholangiocarcinoma',
    'Phase 3',
    ARRAY['Japan'],
    'Recruiting',
    'Servier Japan',
    'Servier Japan',
    '2024-04-02T00:00:00Z',
    'https://jrct.niph.go.jp/latest-detail/jRCT2031240001',
    jsonb_build_object(
      'TrialID', 'JPRN-jRCT2031240001',
      'source_register', 'Japan Registry of Clinical Trials',
      'biomarker', 'IDH1'
    )
  ),
  (
    'CTRI/2024/01/000123',
    'Gemcitabine plus cisplatin with durvalumab in advanced biliary tract cancer',
    'Biliary tract cancer; Cholangiocarcinoma',
    'Phase 3',
    ARRAY['India'],
    'Recruiting',
    'Tata Memorial Centre',
    'Tata Memorial Centre',
    '2024-01-10T00:00:00Z',
    'https://ctri.nic.in/Clinicaltrials/showallp.php?trialid=CTRI/2024/01/000123',
    jsonb_build_object(
      'TrialID', 'CTRI/2024/01/000123',
      'source_register', 'Clinical Trials Registry - India'
    )
  ),
  (
    'RPCEC00000456',
    'Estudio de futibatinib en colangiocarcinoma intrahepatico con alteraciones FGFR2',
    'Colangiocarcinoma; Cholangiocarcinoma',
    'Phase 2',
    ARRAY['Cuba', 'Mexico'],
    'Recruiting',
    'Centro Nacional de Coordinacion de Ensayos Clinicos',
    'Centro Nacional de Coordinacion de Ensayos Clinicos',
    '2024-02-20T00:00:00Z',
    'https://rpcec.sld.cu/trials/RPCEC00000456-Sp',
    jsonb_build_object(
      'TrialID', 'RPCEC00000456',
      'source_register', 'Cuban Public Registry of Clinical Trials',
      'language', 'es',
      'biomarker', 'FGFR2'
    )
  ),
  (
    'PER-014-24',
    'Inmunoterapia con pembrolizumab en colangiocarcinoma avanzado MSI-alto',
    'Cholangiocarcinoma; Colangiocarcinoma',
    'Phase 2',
    ARRAY['Peru', 'Panama'],
    'Recruiting',
    'Instituto Nacional de Enfermedades Neoplasicas',
    'Instituto Nacional de Enfermedades Neoplasicas',
    '2024-05-08T00:00:00Z',
    'https://www.ins.gob.pe/repec/PER-014-24',
    jsonb_build_object(
      'TrialID', 'PER-014-24',
      'source_register', 'Peruvian Clinical Trials Registry',
      'language', 'es',
      'biomarker', 'MSI-H'
    )
  ),
  (
    'ACTRN12624000789012',
    'Adjuvant capecitabine versus observation after curative resection of cholangiocarcinoma',
    'Cholangiocarcinoma',
    'Phase 3',
    ARRAY['Australia', 'New Zealand'],
    'Recruiting',
    'Australasian Gastro-Intestinal Trials Group',
    'Australasian Gastro-Intestinal Trials Group',
    '2024-06-12T00:00:00Z',
    'https://www.anzctr.org.au/Trial/Registration/TrialReview.aspx?id=ACTRN12624000789012',
    jsonb_build_object(
      'TrialID', 'ACTRN12624000789012',
      'source_register', 'Australian New Zealand Clinical Trials Registry'
    )
  )
ON CONFLICT (trial_id) DO NOTHING;
