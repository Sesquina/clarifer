/**
 * Sprint 8 — curated CCF virtual support group schedule.
 * Updated monthly in this file since CCF does not expose an API.
 */

export type SupportAudience = "patient" | "caregiver";
export type SupportLanguage = "English" | "Spanish";

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  frequency: string;
  time: string;
  format: string;
  language: SupportLanguage;
  registrationUrl: string;
  targetAudience: SupportAudience[];
}

export const CCF_SUPPORT_GROUPS: SupportGroup[] = [
  {
    id: "ccf-general-monthly",
    name: "Monthly Patient & Caregiver Support Group",
    description: "General support group for all CCA patients and caregivers.",
    frequency: "Monthly -- first Tuesday",
    time: "7:00 PM ET",
    format: "Virtual (Zoom)",
    language: "English",
    registrationUrl: "https://www.cholangiocarcinoma.org/virtual-support-groups/",
    targetAudience: ["patient", "caregiver"],
  },
  {
    id: "ccf-caregiver-group",
    name: "Caregiver-Only Support Group",
    description: "A safe space for caregivers to share and support each other.",
    frequency: "Monthly",
    time: "7:00 PM ET",
    format: "Virtual (Zoom)",
    language: "English",
    registrationUrl: "https://www.cholangiocarcinoma.org/virtual-support-groups/",
    targetAudience: ["caregiver"],
  },
  {
    id: "ccf-puentes",
    name: "Puentes de Esperanza",
    description: "Grupo de apoyo en espanol para pacientes y cuidadores.",
    frequency: "Monthly",
    time: "7:00 PM ET",
    format: "Virtual (Zoom)",
    language: "Spanish",
    registrationUrl: "https://www.cholangiocarcinoma.org/puentes-de-esperanza/",
    targetAudience: ["patient", "caregiver"],
  },
];

export function sortSupportGroups(
  groups: SupportGroup[],
  opts: { role?: SupportAudience; language?: SupportLanguage }
): SupportGroup[] {
  const role = opts.role;
  const language = opts.language;
  return [...groups].sort((a, b) => {
    if (language === "Spanish") {
      if (a.language === "Spanish" && b.language !== "Spanish") return -1;
      if (b.language === "Spanish" && a.language !== "Spanish") return 1;
    }
    if (role) {
      const aPref = a.targetAudience.includes(role) && a.targetAudience.length === 1 ? 0 : 1;
      const bPref = b.targetAudience.includes(role) && b.targetAudience.length === 1 ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
    }
    return 0;
  });
}
