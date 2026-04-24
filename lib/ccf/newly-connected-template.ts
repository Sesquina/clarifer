/**
 * Sprint 8 — newly connected 30-day checklist template for
 * cholangiocarcinoma patients. Items are grouped by week. A freshly
 * created checklist seeds all items as unchecked.
 */

export interface NewlyConnectedItem {
  id: string;
  week: 1 | 2 | 3 | 4;
  label: string;
  helper?: string;
  href?: string;
  checked: boolean;
}

export function buildChecklist(): NewlyConnectedItem[] {
  const items: Array<Omit<NewlyConnectedItem, "checked">> = [
    // Week 1
    {
      id: "wk1-specialist",
      week: 1,
      label:
        "See a cholangiocarcinoma specialist, not just a general oncologist",
      helper: "Open the specialist finder to pick one near you.",
    },
    {
      id: "wk1-biomarker",
      week: 1,
      label:
        "Request comprehensive biomarker testing (FGFR2, IDH1, IDH2, HER2, MSI, TMB, PD-L1)",
    },
    {
      id: "wk1-second-opinion",
      week: 1,
      label: "Get a second opinion from a CCA specialist center",
    },
    {
      id: "wk1-patient-advocate",
      week: 1,
      label: "Connect with a CCF Patient Advocate (free)",
      href: "https://www.cholangiocarcinoma.org/connect-with-a-patient-advocate/",
    },
    {
      id: "wk1-care-kit",
      week: 1,
      label:
        "Join CCF's Newly Connected program and request your free care kit",
      href: "https://www.cholangiocarcinoma.org/newly-connected/",
    },
    {
      id: "wk1-care-team",
      week: 1,
      label: "Add your care team to Clarifer",
    },
    // Week 2
    {
      id: "wk2-plan",
      week: 2,
      label: "Understand your treatment plan with your oncologist",
    },
    {
      id: "wk2-dpd",
      week: 2,
      label:
        "Ask about DPD enzyme deficiency screening if 5-FU or Capecitabine is planned",
    },
    {
      id: "wk2-nccn",
      week: 2,
      label: "Review NCCN guidelines for cholangiocarcinoma",
      href: "https://www.nccn.org/guidelines/category_1",
    },
    {
      id: "wk2-trials",
      week: 2,
      label: "Ask about clinical trial eligibility",
    },
    {
      id: "wk2-medications",
      week: 2,
      label: "Set up medication tracking in Clarifer",
    },
    // Week 3
    {
      id: "wk3-support",
      week: 3,
      label: "Join a CCF virtual support group",
      href: "https://www.cholangiocarcinoma.org/virtual-support-groups/",
    },
    {
      id: "wk3-mentor",
      week: 3,
      label:
        "Connect with a CCF mentor (a patient who has been through this)",
      href: "https://www.cholangiocarcinoma.org/mentor-program/",
    },
    {
      id: "wk3-family",
      week: 3,
      label:
        "Tell your family -- use Clarifer's family update generator to explain the diagnosis in plain language",
    },
    {
      id: "wk3-emergency-card",
      week: 3,
      label: "Set up your Clarifer emergency card",
    },
    // Week 4
    {
      id: "wk4-symptom-log",
      week: 4,
      label: "Establish a symptom logging routine (daily, under 60s)",
    },
    {
      id: "wk4-appt-reminders",
      week: 4,
      label: "Set up appointment reminders",
    },
    {
      id: "wk4-nutrition",
      week: 4,
      label: "Download CCF's nutrition guide for CCA patients",
      href: "https://www.cholangiocarcinoma.org/nutrition-and-cholangiocarcinoma/",
    },
    {
      id: "wk4-research",
      week: 4,
      label: "Ask your oncologist about research participation",
    },
  ];
  return items.map((i) => ({ ...i, checked: false }));
}

export const WEEK_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Week 1 -- First Steps",
  2: "Week 2 -- Treatment Understanding",
  3: "Week 3 -- Support",
  4: "Week 4 -- Ongoing Care",
};
