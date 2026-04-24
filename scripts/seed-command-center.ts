import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const tasks = [
  // SAMIRA LANE
  {
    title: "83(b) election. File by May 22.",
    description:
      "every.io to Clarifer Corp to download form to print to fill to mail USPS certified. Missing this costs tens of thousands in taxes.",
    lane: "samira",
    priority: "high",
    category: "legal",
    due_date: "2026-05-22",
    assigned_to: "samira",
  },
  {
    title: "Run pending migrations",
    description:
      "cd C:\\Users\\esqui\\clarifier and run .\\scripts\\run-migrations.ps1",
    lane: "samira",
    priority: "high",
    category: "development",
    assigned_to: "samira",
  },
  {
    title: "Supabase BAA follow-up",
    description:
      "Email enterprise@supabase.com. No PHI in production until signed.",
    lane: "samira",
    priority: "high",
    category: "legal",
    assigned_to: "samira",
  },
  {
    title: "Anthropic BAA follow-up",
    description:
      "Email sales@anthropic.com. Required before PHI touches AI prompts.",
    lane: "samira",
    priority: "high",
    category: "legal",
    assigned_to: "samira",
  },
  {
    title: "Apple Sign In setup",
    description:
      "developer.apple.com to enable Sign In with Apple to generate .p8 key to configure in Supabase. Takes 20 minutes.",
    lane: "samira",
    priority: "medium",
    category: "development",
    assigned_to: "samira",
  },
  {
    title: "CCF demo rehearsal. Twice before May 8.",
    description:
      "Run full 18-step demo start to finish. Time it. Practice founding story. Confirm demo@clarifer.com works.",
    lane: "samira",
    priority: "high",
    category: "partnerships",
    due_date: "2026-05-07",
    assigned_to: "samira",
  },
  // MICHAEL LANE
  {
    title: "10 caregivers recruited. 0 of 10.",
    description:
      "Must have 10 real caregivers using Clarifer with documented written feedback before July 31. This is the ACL grant requirement. Start with CCF network on May 8.",
    lane: "michael",
    priority: "high",
    category: "partnerships",
    due_date: "2026-07-15",
    assigned_to: "michael",
  },
  {
    title: "CCF follow-up after May 8 demo",
    description:
      "Send thank you plus ask for letter of support plus co-applicant status for ACL grant plus intro to 10 caregivers in their network.",
    lane: "michael",
    priority: "high",
    category: "partnerships",
    due_date: "2026-05-10",
    assigned_to: "michael",
  },
  {
    title: "Apply for DUNS number",
    description:
      "Required for Google Play Store. Free. Apply at dnb.com. Takes 1 to 2 weeks. Apply today.",
    lane: "michael",
    priority: "high",
    category: "organizational",
    assigned_to: "michael",
  },
  {
    title: "Email Caregiver Action Network",
    description:
      "Named ACL grant partner. Email now: we are applying for the ACL Caregiver AI grant and would like to discuss collaboration.",
    lane: "michael",
    priority: "high",
    category: "partnerships",
    assigned_to: "michael",
  },
  {
    title: "Email Ximena at Startup Mexico",
    description:
      "Send one-pager PDF when app is live on App Store. Subject: Ximena, lo construi. Ask for connections to IMSS, Angeles, GNP.",
    lane: "michael",
    priority: "medium",
    category: "sales",
    assigned_to: "michael",
  },
  {
    title: "ACL informational webinar. Attend in May.",
    description:
      "Email CaregiverAI@acl.hhs.gov with Join List in subject. Attend live. Ask about condition-agnostic platforms serving international communities.",
    lane: "michael",
    priority: "medium",
    category: "partnerships",
    assigned_to: "michael",
  },
  // BLOCKED LANE
  {
    title: "EIN from IRS",
    description:
      "Applied April 22 via every.io. Arrives approximately May 6. Unlocks: bank account, Twilio SMS setup, DUNS application.",
    lane: "blocked",
    priority: "high",
    category: "organizational",
  },
  {
    title: "Supabase BAA response",
    description:
      "Email sent to enterprise@supabase.com. Waiting on response. Blocks: PHI in production.",
    lane: "blocked",
    priority: "high",
    category: "legal",
  },
  {
    title: "Anthropic BAA response",
    description:
      "Email sent to sales@anthropic.com. Waiting on response. Blocks: PHI in AI prompts.",
    lane: "blocked",
    priority: "high",
    category: "legal",
  },
  {
    title: "Apple App Store review",
    description:
      "Not yet submitted. Submission target: May 1. Review takes 1 to 7 days. App live target: May 10 to 17.",
    lane: "blocked",
    priority: "medium",
    category: "development",
  },
  // BUILD LANE (current and next sprints)
  {
    title: "Website sprint. Running now.",
    description:
      "Landing page, login, download page, about, platform sidebar. Zero Medalyn references. Clarifer branding throughout.",
    lane: "build",
    priority: "high",
    category: "development",
  },
  {
    title: "Sprint 9. Clinical trials and family updates.",
    description:
      "ClinicalTrials.gov filtered search, WHO ICTRP for MX/PA, EN plus ES family updates, WhatsApp copy button.",
    lane: "build",
    priority: "high",
    category: "development",
  },
];

async function seed() {
  console.log("Seeding command center tasks...");
  const { error } = await supabase.from("team_tasks").insert(tasks);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Seeded ${tasks.length} tasks.`);
}

seed();
