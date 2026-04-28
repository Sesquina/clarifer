/**
 * tests/api/appointments/action-items.test.ts
 * PATCH /api/appointments/[id] now accepts post_visit_action_items
 * (structured JSON) in addition to the Sprint 7 fields.
 * Tables: mocks users, appointments, audit_log.
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI; synthetic ids.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const updates: Array<Record<string, unknown>> = [];

function makeSupabase() {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { role: "caregiver", organization_id: "org-A" } }),
        };
      }
      if (table === "appointments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "appt-1", patient_id: "pat-1" } }),
          update: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            updates.push(row);
            return {
              eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            };
          }),
        };
      }
      if (table === "audit_log") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    }),
  };
}

describe("PATCH /api/appointments/[id] -- action items", () => {
  beforeEach(() => {
    vi.resetModules();
    updates.length = 0;
  });

  it("28. PATCH with post_visit_action_items array persists the structured list", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    const { PATCH } = await import("@/app/api/appointments/[id]/route");
    const items = [
      { text: "Schedule follow-up CT in 8 weeks", done: false },
      { text: "Refill capecitabine", done: false },
    ];
    const res = await PATCH(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ post_visit_action_items: items }),
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(200);
    expect(updates[0].post_visit_action_items).toEqual(items);
  });

  it("29. PATCH ignores non-array post_visit_action_items", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    const { PATCH } = await import("@/app/api/appointments/[id]/route");
    const res = await PATCH(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ post_visit_action_items: "not-an-array" }),
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(200);
    // Update map should not include post_visit_action_items.
    if (updates.length > 0) {
      expect(updates[0]).not.toHaveProperty("post_visit_action_items");
    }
  });
});
