/**
 * scripts/seed-hq-db.ts
 * Seeds HQ sprint board directly via Supabase service role key.
 * Does NOT require the Next.js dev server to be running.
 *
 * Usage: npx tsx scripts/seed-hq-db.ts
 *
 * Status mapping (DB allows: active | done | archived):
 *   done       → done
 *   in-progress → active
 *   queued     → active
 *   open       → active
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Sprint entry — maps to sprint_updates table
// Fields not in schema (status, ts_errors) are omitted.
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
// Tasks — maps to team_tasks table
// status values mapped: done→done, in-progress/queued/open→active
// priority defaults to "medium" for all (not specified in task spec).
// ---------------------------------------------------------------------------
const TASKS = [
  {
    title: "S1 — Password reset redirect fixed",
    lane: "build",
    status: "done",
    due_date: "2026-05-25",
    description:
      "Fixed mobile password reset URL redirecting to nonexistent page. commit c52a81d. 294 tests passing.",
  },
  {
    title: "S2-S4 — PHI write audit complete",
    lane: "build",
    status: "done",
    due_date: "2026-05-25",
    description:
      "All 7 client-side PHI writes moved to server-side API routes with auth + role + org_id + audit_log. 0 client-side writes remain. commit 01c9366.",
  },
  {
    title: "S5 — Audit log on upload and deletion",
    lane: "build",
    status: "done",
    due_date: "2026-05-25",
    description:
      "Document upload and account deletion now write audit_log with all required HIPAA fields. Audit log written before deletion, not after. commit b182e8e.",
  },
  {
    title: "S6 — Account deletion cascade",
    lane: "build",
    status: "active",
    due_date: "2026-05-27",
    description:
      "Account deletion must cascade across all 12 patient data tables. Migration SQL being written. Not yet merged.",
  },
  {
    title: "S7 — trial_saves org_id fix",
    lane: "build",
    status: "active",
    due_date: "2026-05-27",
    description:
      "trial_saves upsert missing organization_id. Queued after S6 merges.",
  },
  {
    title: "S8 — Fix failing Vitest tests",
    lane: "build",
    status: "active",
    due_date: "2026-05-27",
    description:
      "7 tests currently failing. Fix root cause — do not delete or skip. All tests must pass before Phase 1 closes.",
  },
  {
    title: "S9 — Em dash audit",
    lane: "build",
    status: "active",
    due_date: "2026-05-27",
    description:
      "13 files contain em dashes in copy. Replace with comma or short phrase. No em dashes anywhere in product.",
  },
  {
    title: "Run pending migrations in Supabase",
    lane: "samira",
    status: "active",
    due_date: "2026-05-27",
    description:
      "Two migrations not yet applied to production: 20260428000003_who_ictrp_mirror.sql and 20260428000004_care_team_directory.sql. Run manually in Supabase SQL Editor on project lrhwgswbsctfqtvdjntr.",
  },
  {
    title: "Supabase BAA follow-up",
    lane: "samira",
    status: "active",
    due_date: "2026-05-28",
    description:
      "Email enterprise@supabase.com. No real PHI can touch the database until BAA is signed. Block on all document analysis features until confirmed.",
  },
  {
    title: "Anthropic BAA follow-up",
    lane: "samira",
    status: "active",
    due_date: "2026-05-28",
    description:
      "Email sales@anthropic.com. Required before any patient data goes into AI prompts. Currently using anonymized/summarized data only.",
  },
  {
    title: "SAM.gov UEI registration",
    lane: "samira",
    status: "active",
    due_date: "2026-06-01",
    description:
      "Required for ACL Caregiver AI Challenge grant (July 31 deadline, up to $150K). Go to sam.gov. Need EIN, legal name Clarifer Corp, NAICS 541511. Takes 7-10 business days to activate. Start immediately.",
  },
  {
    title: "10 caregivers recruited — 0 of 10",
    lane: "michael",
    status: "active",
    due_date: "2026-07-15",
    description:
      "ACL grant requires 10 real caregivers actively using Clarifer with documented written feedback. Primary deliverable before July 31. Clarifer is live at clarifer.com — ready for real users now.",
  },
  {
    title: "CCF letter of support",
    lane: "michael",
    status: "active",
    due_date: "2026-06-01",
    description:
      "Requested at the May 8 demo with Melinda Bachini and Lourdes Rocha-Nussbaum. Follow up with Lourdes to confirm status. Required for ACL grant application.",
  },
  {
    title: "CCF research team presentation",
    lane: "michael",
    status: "active",
    due_date: "2026-06-15",
    description:
      "CCF expressed interest in a research team presentation after the May 8 demo. Schedule with Lourdes Rocha-Nussbaum. This is the warm next step in the CCF partnership.",
  },
  {
    title: "Cofounder agreement — confirm signed",
    lane: "michael",
    status: "active",
    due_date: "2026-05-31",
    description:
      "60/40 milestone-vested terms were drafted. Confirm the agreement is fully signed and filed. Michael owns growth, caregiver recruitment, and business development.",
  },
  {
    title: "Supabase BAA — awaiting response",
    lane: "blocked",
    status: "active",
    due_date: null,
    description:
      "No PHI in production database until BAA is signed. Samira following up with enterprise@supabase.com. Blocks: document analysis, wearable integration, full symptom data in AI prompts.",
  },
  {
    title: "Anthropic BAA — awaiting response",
    lane: "blocked",
    status: "active",
    due_date: null,
    description:
      "No patient data in AI prompts until BAA is confirmed. Samira following up with sales@anthropic.com. Currently using anonymized summaries only.",
  },
  {
    title: "83(b) election — with tax attorney",
    lane: "blocked",
    status: "active",
    due_date: null,
    description:
      "Missed the 30-day window. Samira is handling with a tax attorney outside Claude. Do not raise in sessions.",
  },
];

async function main() {
  console.log("=== HQ Seed (direct DB) ===\n");

  // --- Sprint ---
  console.log("Inserting sprint...");
  const { data: sprintData, error: sprintError } = await supabase
    .from("sprint_updates")
    .insert(SPRINT)
    .select()
    .single();

  if (sprintError) {
    console.error("  FAIL:", sprintError.message);
    process.exit(1);
  }
  console.log("  Sprint created:", sprintData.id, `"${sprintData.sprint_name}"`);

  // --- Tasks ---
  console.log(`\nInserting ${TASKS.length} tasks...`);
  let ok = 0;
  let fail = 0;

  for (const task of TASKS) {
    const { data, error } = await supabase
      .from("team_tasks")
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error(`  [FAIL] ${task.title}: ${error.message}`);
      fail++;
    } else {
      console.log(`  [OK]   ${task.lane.padEnd(8)} | ${task.status.padEnd(6)} | ${data.id.slice(0, 8)} | ${task.title}`);
      ok++;
    }
  }

  console.log(`\nDone. Sprint: 1. Tasks: ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
