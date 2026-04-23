-- Sprint 2A: Dementia condition template
-- Persona: elderly parent caregiver
-- Guardrails: does not assess cognitive stage, does not recommend medication changes, does not speculate on progression
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
  'dementia',
  'Dementia',
  'neurology',
  'dementia, cognitive decline, memory loss, elderly parent caregiver. GUARDRAILS: does not assess cognitive stage, does not recommend medication changes, does not speculate on progression.',
  '[
    {"key": "memory_loss",        "label": "Memory loss",                "type": "scale",    "min": 1, "max": 10},
    {"key": "confusion",          "label": "Confusion / disorientation", "type": "scale",    "min": 1, "max": 10},
    {"key": "sleep_disruption",   "label": "Sleep disruption",           "type": "scale",    "min": 1, "max": 10},
    {"key": "caregiver_stress",   "label": "Caregiver stress level",     "type": "scale",    "min": 1, "max": 10},
    {"key": "behavioral_changes", "label": "Behavioral changes",         "type": "checkbox", "options": ["aggression", "wandering", "repetition", "agitation"]},
    {"key": "eating_hygiene",     "label": "Eating and hygiene",         "type": "checkbox", "options": ["refuses food", "forgets to eat", "hygiene neglect"]}
  ]'::jsonb,
  '["memory_loss", "cognitive_decline", "confusion", "disorientation", "wandering", "behavioral_changes", "eating_changes", "sleep_disruption", "aggression"]'::jsonb,
  '{"common_medications": ["donepezil", "rivastigmine", "memantine", "sertraline", "lorazepam"]}'::jsonb,
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
