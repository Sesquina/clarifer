/**
 * lib/appointments/checklist-templates.ts
 * Pre-visit checklist templates by condition_template_id and appointment_type.
 * Tables: read condition_templates only (caller's responsibility)
 * Auth: pure data, no auth
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI. Static checklists shipped with the app. Items are
 * caregiver-facing prompts (questions to raise with the care team),
 * never diagnostic guidance and never instructions to change a
 * medication or treatment plan -- they always route the conversation
 * back to the clinician.
 */

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

const FALLBACK: ChecklistItem[] = [
  { text: "Bring the current medication list and dosing schedule", checked: false },
  { text: "Note any new symptoms or side effects since the last visit", checked: false },
  { text: "Write down questions you want to ask the care team", checked: false },
];

const CHOLANGIOCARCINOMA_ONCOLOGY: ChecklistItem[] = [
  { text: "Ask about CA 19-9 and CEA tumor marker levels", checked: false },
  { text: "Ask about FGFR2 fusion/rearrangement status", checked: false },
  { text: "Ask about next imaging schedule (CT or MRI)", checked: false },
  { text: "Ask about clinical trial eligibility", checked: false },
  { text: "Review current medication side effects", checked: false },
  { text: "Ask about pain management options", checked: false },
  { text: "Ask about nutrition and weight management support", checked: false },
];

const CHOLANGIOCARCINOMA_GENERIC: ChecklistItem[] = [
  { text: "Ask about CA 19-9 and CEA tumor marker levels", checked: false },
  { text: "Review current medication side effects", checked: false },
  { text: "Ask about pain management options", checked: false },
];

const DEMENTIA_NEUROLOGY: ChecklistItem[] = [
  { text: "Bring the symptom log from the last 30 days", checked: false },
  { text: "Note new behavioral changes (aggression, wandering, repetition)", checked: false },
  { text: "Ask about caregiver respite resources", checked: false },
  { text: "Ask about advance care planning conversations", checked: false },
];

const DEMENTIA_GENERIC: ChecklistItem[] = [
  { text: "Bring the symptom log from the last 30 days", checked: false },
  { text: "Note new behavioral changes since the last visit", checked: false },
  { text: "Ask about caregiver respite resources", checked: false },
];

/**
 * Returns a deep copy of the checklist that best matches the given
 * condition_template_id and appointment_type. Always returns a fresh
 * array (callers can safely mutate the returned items without affecting
 * the canonical templates above). If neither condition nor appointment
 * type matches, falls back to a generic prep list.
 *
 * Lookup precedence (most specific to least):
 *   1. condition + appointment_type exact match
 *   2. condition default (any appointment_type)
 *   3. FALLBACK
 */
export function getPreVisitChecklist(
  conditionTemplateId: string | null | undefined,
  appointmentType: string | null | undefined
): ChecklistItem[] {
  const cond = (conditionTemplateId ?? "").toLowerCase();
  const apptType = (appointmentType ?? "").toLowerCase();

  if (cond === "cholangiocarcinoma") {
    if (apptType === "oncology") return clone(CHOLANGIOCARCINOMA_ONCOLOGY);
    return clone(CHOLANGIOCARCINOMA_GENERIC);
  }

  if (cond === "dementia") {
    if (apptType === "neurology") return clone(DEMENTIA_NEUROLOGY);
    return clone(DEMENTIA_GENERIC);
  }

  return clone(FALLBACK);
}

function clone(items: ChecklistItem[]): ChecklistItem[] {
  return items.map((i) => ({ text: i.text, checked: i.checked }));
}
