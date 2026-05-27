/**
 * scripts/seed-hq-data.ts
 * Seeds HQ sprint board via HTTP API routes.
 * Requires the Next.js dev server to be running at http://localhost:3000.
 *
 * Usage: npx tsx scripts/seed-hq-data.ts
 *
 * NOTE: If the dev server is not running, use scripts/seed-hq-db.ts instead
 * (direct Supabase insert via service role key).
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE_URL = "http://localhost:3000";
const SECRET = process.env.INTERNAL_API_SECRET;

if (!SECRET) {
  console.error("ERROR: INTERNAL_API_SECRET not set in .env.local");
  process.exit(1);
}

const HEADERS = {
  Authorization: `Bearer ${SECRET}`,
  "Content-Type": "application/json",
};

async function post(route: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${route} failed [${res.status}]: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Sprint entry — field names match sprint_updates table / POST /api/hq/sprints
// ---------------------------------------------------------------------------
const SPRINT = {
  sprint_name: "Phase 1 — Debt clearance",
  summary:
    "Clearing all known bugs and HIPAA debt before building new features. S1-S8 target completion May 27. 7 client-side PHI writes fixed. audit_log complete on upload and deletion.",
  tests_after: 304,
  files_changed: 45,
  blockers: ["Supabase BAA pending", "Anthropic BAA pending"],
  migrations_pending: [] as string[],
};

// ---------------------------------------------------------------------------
// Tasks — field names match team_tasks table / POST /api/hq/tasks
// NOTE: The POST route does not accept `status`; all tasks default to "active".
// Use seed-hq-db.ts to set exact status values.
// ---------------------------------------------------------------------------
const TASKS = [
  {
    title: "S1 — Password reset redirect fixed",
    lane: "build",
    due_date: "2026-05-25",
    description:
      "Fixed mobile password reset URL redirecting to nonexistent page. commit c52a81d. 294 tests passing.",
  },
  {
    title: "S2-S4 — PHI write audit complete",
    lane: "build",
    due_date: "2026-05-25",
    description:
      "All 7 client-side PHI writes moved to server-side API routes with auth + role + org_id + audit_log. 0 client-side writes remain. commit 01c9366.",
  },
  {
    title: "S5 — Audit log on upload and deletion",
    lane: "build",
    due_date: "2026-05-25",
    description:
      "Document upload and account deletion now write audit_log with all required HIPAA fields. Audit log written before deletion, not after. commit b182e8e.",
  },
  {
    title: "S6 — Account deletion cascade",
    lane: "build",
    due_date: "2026-05-27",
    description:
      "Account deletion must cascade across all 12 patient data tables. Migration SQL being written. Not yet merged.",
  },
  {
    title: "S7 — trial_saves org_id fix",
    lane: "build",
    due_date: "2026-05-27",
    description:
      "trial_saves upsert missing organization_id. Queued after S6 merges.",
  },
  {
    title: "S8 — Fix failing Vitest tests",
    lane: "build",
    due_date: "2026-05-27",
    description:
      "7 tests currently failing. Fix root cause — do not delete or skip. All tests must pass before Phase 1 closes.",
  },
  {
    title: "S9 — Em dash audit",
    lane: "build",
    due_date: "2026-05-27",
    description:
      "13 files contain em dashes in copy. Replace with comma or short phrase. No em dashes anywhere in product.",
  },
  {
    title: "Run pending migrations in Supabase",
    lane: "samira",
    due_date: "2026-05-27",
    description:
      "Two migrations not yet applied to production: 20260428000003_who_ictrp_mirror.sql and 20260428000004_care_team_directory.sql. Run manually in Supabase SQL Editor on project lrhwgswbsctfqtvdjntr.",
  },
  {
    title: "Supabase BAA follow-up",
    lane: "samira",
    due_date: "2026-05-28",
    description:
      "Email enterprise@supabase.com. No real PHI can touch the database until BAA is signed. Block on all document analysis features until confirmed.",
  },
  {
    title: "Anthropic BAA follow-up",
    lane: "samira",
    due_date: "2026-05-28",
    description:
      "Email sales@anthropic.com. Required before any patient data goes into AI prompts. Currently using anonymized/summarized data only.",
  },
  {
    title: "SAM.gov UEI registration",
    lane: "samira",
    due_date: "2026-06-01",
    description:
      "Required for ACL Caregiver AI Challenge grant (July 31 deadline, up to $150K). Go to sam.gov. Need EIN, legal name Clarifer Corp, NAICS 541511. Takes 7-10 business days to activate. Start immediately.",
  },
  {
    title: "10 caregivers recruited — 0 of 10",
    lane: "michael",
    due_date: "2026-07-15",
    description:
      "ACL grant requires 10 real caregivers actively using Clarifer with documented written feedback. Primary deliverable before July 31. Clarifer is live at clarifer.com — ready for real users now.",
  },
  {
    title: "CCF letter of support",
    lane: "michael",
    due_date: "2026-06-01",
    description:
      "Requested at the May 8 demo with Melinda Bachini and Lourdes Rocha-Nussbaum. Follow up with Lourdes to confirm status. Required for ACL grant application.",
  },
  {
    title: "CCF research team presentation",
    lane: "michael",
    due_date: "2026-06-15",
    description:
      "CCF expressed interest in a research team presentation after the May 8 demo. Schedule with Lourdes Rocha-Nussbaum. This is the warm next step in the CCF partnership.",
  },
  {
    title: "Cofounder agreement — confirm signed",
    lane: "michael",
    due_date: "2026-05-31",
    description:
      "60/40 milestone-vested terms were drafted. Confirm the agreement is fully signed and filed. Michael owns growth, caregiver recruitment, and business development.",
  },
  {
    title: "Supabase BAA — awaiting response",
    lane: "blocked",
    due_date: null,
    description:
      "No PHI in production database until BAA is signed. Samira following up with enterprise@supabase.com. Blocks: document analysis, wearable integration, full symptom data in AI prompts.",
  },
  {
    title: "Anthropic BAA — awaiting response",
    lane: "blocked",
    due_date: null,
    description:
      "No patient data in AI prompts until BAA is confirmed. Samira following up with sales@anthropic.com. Currently using anonymized summaries only.",
  },
  {
    title: "83(b) election — with tax attorney",
    lane: "blocked",
    due_date: null,
    description:
      "Missed the 30-day window. Samira is handling with a tax attorney outside Claude. Do not raise in sessions.",
  },
];

async function main() {
  console.log("=== HQ Seed (HTTP API) ===\n");

  // Seed sprint
  console.log("Posting sprint...");
  const sprintRes = await post("/api/hq/sprints", SPRINT) as { sprint?: { id: string } };
  console.log("  Sprint created:", sprintRes?.sprint?.id ?? "(no id)");

  // Seed tasks
  console.log(`\nPosting ${TASKS.length} tasks...`);
  let ok = 0;
  let fail = 0;
  for (const task of TASKS) {
    try {
      await post("/api/hq/tasks", task);
      console.log(`  [OK] ${task.title}`);
      ok++;
    } catch (err) {
      console.error(`  [FAIL] ${task.title}: ${err}`);
      fail++;
    }
  }

  console.log(`\nDone. Tasks: ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
