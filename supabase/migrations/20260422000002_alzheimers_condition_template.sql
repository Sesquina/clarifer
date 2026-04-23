-- Sprint 2B: Alzheimer's Disease condition template
-- Persona: elderly parent caregiver
-- Distinct from dementia: includes word_finding_difficulty and mood_changes fields
-- Guardrails: does not assess disease stage, does not recommend medication changes, does not speculate on progression timeline
--
-- FIX 2026-04-23: id column is UUID. Insert with gen_random_uuid() and use the
-- slug column for text lookup. Prerequisite: 20260421120000_condition_templates_slug.sql.

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
  'alzheimers',
  'Alzheimer''s Disease',
  'neurology',
  'alzheimers disease, progressive neurodegeneration, memory loss, word-finding difficulty, elderly parent caregiver. GUARDRAILS: does not assess disease stage, does not recommend medication changes, does not speculate on progression timeline.',
  '[
    {"key": "memory_loss",             "label": "Memory loss",                "type": "scale",    "min": 1, "max": 10},
    {"key": "word_finding_difficulty", "label": "Word-finding difficulty",    "type": "scale",    "min": 1, "max": 10},
    {"key": "confusion",               "label": "Confusion / disorientation", "type": "scale",    "min": 1, "max": 10},
    {"key": "sleep_disruption",        "label": "Sleep disruption",           "type": "scale",    "min": 1, "max": 10},
    {"key": "caregiver_stress",        "label": "Caregiver stress level",     "type": "scale",    "min": 1, "max": 10},
    {"key": "mood_changes",            "label": "Mood changes",               "type": "checkbox", "options": ["depression", "anxiety", "irritability", "apathy"]},
    {"key": "behavioral_changes",      "label": "Behavioral changes",         "type": "checkbox", "options": ["aggression", "wandering", "repetition", "agitation"]}
  ]'::jsonb,
  '["memory_loss", "word_finding_difficulty", "confusion", "disorientation", "wandering", "behavioral_changes", "eating_changes", "sleep_disruption", "mood_changes"]'::jsonb,
  '{"common_medications": ["donepezil", "rivastigmine", "memantine", "aricept", "exelon"]}'::jsonb,
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
