-- Sprint 6 — cholangiocarcinoma condition template (CCF demo primary condition).
--
-- FIX 2026-04-23: id column is UUID. Insert with gen_random_uuid() and use the
-- slug column for text lookup. Prerequisite: 20260421120000_condition_templates_slug.sql.
-- DO NOT execute manually.

INSERT INTO public.condition_templates (
  id,
  slug,
  name,
  category,
  ai_context,
  symptom_questions,
  symptom_vocabulary,
  trial_filters,
  is_active
) VALUES (
  gen_random_uuid(),
  'cholangiocarcinoma',
  'Cholangiocarcinoma (Bile Duct Cancer)',
  'oncology',
  'Patient has cholangiocarcinoma (bile duct cancer).
   This is the founding condition of Clarifer — built while
   caring for a father with Stage 4 cholangiocarcinoma.
   GUARDRAILS: Do not speculate on prognosis or survival.
   Do not recommend treatment changes. Do not diagnose.
   Focus entirely on care coordination and quality of life.',
  '[
    {"key":"pain_level","label":"Pain level","type":"scale","min":1,"max":10},
    {"key":"fatigue","label":"Fatigue","type":"scale","min":1,"max":10},
    {"key":"nausea","label":"Nausea","type":"scale","min":1,"max":10},
    {"key":"jaundice","label":"Jaundice (yellowing of skin/eyes)","type":"scale","min":1,"max":10},
    {"key":"appetite","label":"Appetite","type":"scale","min":1,"max":10},
    {"key":"itching","label":"Itching","type":"scale","min":1,"max":10},
    {"key":"symptoms_present","label":"Symptoms present today","type":"checkbox",
     "options":["abdominal pain","dark urine","pale stools","fever","chills","weight loss","bloating"]},
    {"key":"mood","label":"Emotional state","type":"checkbox",
     "options":["anxious","hopeful","exhausted","peaceful","frustrated","grateful"]}
  ]'::jsonb,
  '["jaundice","cholangiocarcinoma","bile_duct_cancer","biliary","abdominal_pain","fatigue","nausea","itching","weight_loss","dark_urine"]'::jsonb,
  '{"condition":"cholangiocarcinoma","icd10":"C22.1","phase":["1","2","3","4"],"common_medications":["gemcitabine","cisplatin","pemigatinib","infigratinib","durvalumab","oxaliplatin"]}'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name               = EXCLUDED.name,
  category           = EXCLUDED.category,
  ai_context         = EXCLUDED.ai_context,
  symptom_questions  = EXCLUDED.symptom_questions,
  symptom_vocabulary = EXCLUDED.symptom_vocabulary,
  trial_filters      = EXCLUDED.trial_filters,
  is_active          = EXCLUDED.is_active;
