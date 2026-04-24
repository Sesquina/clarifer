import { describe, it, expect } from "vitest";
import { generateDigestEmail } from "@/lib/email/digest-template";
import type { TeamTask, SprintUpdate } from "@/lib/internal/types";

const today = new Date("2026-04-24T00:00:00Z");

function makeTask(over: Partial<TeamTask> = {}): TeamTask {
  return {
    id: "t",
    title: "Task",
    description: null,
    lane: "samira",
    priority: "medium",
    status: "active",
    due_date: null,
    category: "development",
    assigned_to: "samira",
    created_by: "claude",
    completed_at: null,
    created_at: "2026-04-24T00:00:00Z",
    updated_at: "2026-04-24T00:00:00Z",
    ...over,
  };
}

const lastSprint: SprintUpdate = {
  id: "s",
  sprint_name: "sprint-infra-website",
  sprint_number: null,
  branch: "sprint-infra-website",
  summary: "Website rebrand + login page + platform layout scaffold.",
  tests_before: 128,
  tests_after: 136,
  files_changed: 10,
  migrations_pending: [],
  manual_actions: [],
  blockers: [],
  next_sprint: "sprint-cc-command-center",
  commit_hash: "b9184b9",
  built_by: "claude",
  created_at: "2026-04-24T00:00:00Z",
};

describe("digest generator", () => {
  it("8. Samira email includes all lanes and sprint summary", () => {
    const tasks = [
      makeTask({ id: "1", lane: "samira", priority: "high", title: "83b election" }),
      makeTask({ id: "2", lane: "michael", priority: "high", title: "10 caregivers" }),
      makeTask({ id: "3", lane: "blocked", priority: "high", title: "EIN from IRS" }),
      makeTask({ id: "4", lane: "build", priority: "high", title: "Command Center" }),
    ];
    const digest = generateDigestEmail({
      accessLevel: "full",
      tasks,
      lastSprint,
      nextSprint: "sprint-cc-command-center",
      counts: { testsPassing: 136, sprintsComplete: 8, openBlockers: 1 },
      today,
    });
    expect(digest.recipient).toBe("samira");
    expect(digest.subject).toMatch(/days to CCF demo/);
    expect(digest.html).toContain("83b election");
    expect(digest.html).toContain("10 caregivers");
    expect(digest.html).toContain("EIN from IRS");
    expect(digest.html).toContain("Command Center");
    expect(digest.html).toContain("sprint-infra-website");
    expect(digest.html).toContain("Next sprint");
  });

  it("9. Michael email shows only his lane + blocked, no sprint details", () => {
    const tasks = [
      makeTask({ id: "1", lane: "samira", priority: "high", title: "Samira secret task" }),
      makeTask({ id: "2", lane: "michael", priority: "high", title: "10 caregivers" }),
      makeTask({ id: "3", lane: "blocked", priority: "high", title: "EIN from IRS" }),
      makeTask({ id: "4", lane: "build", priority: "high", title: "Claude build task" }),
    ];
    const digest = generateDigestEmail({
      accessLevel: "growth",
      tasks,
      lastSprint,
      nextSprint: "sprint-cc-command-center",
      counts: { testsPassing: 136, sprintsComplete: 8, openBlockers: 1 },
      today,
    });
    expect(digest.recipient).toBe("michael");
    expect(digest.subject).toMatch(/Your action items/i);
    expect(digest.html).toContain("10 caregivers");
    expect(digest.html).toContain("EIN from IRS");
    expect(digest.html).not.toContain("Samira secret task");
    expect(digest.html).not.toContain("Claude build task");
    // Michael does not see last-sprint block
    expect(digest.html).not.toContain("Last sprint:");
    expect(digest.html).not.toContain("Next sprint");
  });
});
