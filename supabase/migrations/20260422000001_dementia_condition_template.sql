-- Sprint 2A: Add dementia condition template
-- Persona: elderly parent caregiver
-- Guardrails: does not assess cognitive stage, does not recommend medication changes, does not speculate on progression

INSERT INTO condition_templates (
  id,
  name,
  category,
  ai_context,
  symptom_questions,
  symptom_vocabulary,
  trial_filters,
  is_active
) VALUES (
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
  ]',
  '["memory_loss", "cognitive_decline", "confusion", "disorientation", "wandering", "behavioral_changes", "eating_changes", "sleep_disruption", "aggression"]',
  '{"common_medications": ["donepezil", "rivastigmine", "memantine", "sertraline", "lorazepam"]}',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name               = EXCLUDED.name,
  category           = EXCLUDED.category,
  ai_context         = EXCLUDED.ai_context,
  symptom_questions  = EXCLUDED.symptom_questions,
  symptom_vocabulary = EXCLUDED.symptom_vocabulary,
  trial_filters      = EXCLUDED.trial_filters,
  is_active          = EXCLUDED.is_active;
