/**
 * Sprint 7 — appointments detail (GET/PATCH).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER, TEST_PATIENT_CARLOS } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const updates: Array<Record<string, unknown>> = [];
const auditInserts: Array<Record<string, unknown>> = [];

const baseAppointment = {
  id: "appt-1",
  patient_id: TEST_PATIENT_CARLOS.id,
  organization_id: "test-org-ccf-demo",
  title: "Oncology follow-up",
  datetime: "2026-05-01T15:00:00Z",
  pre_visit_checklist: [
    { text: "Ask about CA 19-9", checked: false },
    { text: "Review imaging", checked: false },
  ],
  post_visit_notes: "",
  appointment_type: "oncology",
};

function makeSupabase(opts: { role?: string; existing?: typeof baseAppointment | null }) {
  const { role = "caregiver", existing = baseAppointment } = opts;
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: TEST_CAREGIVER.id } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role, organization_id: "test-org-ccf-demo" } }),
        };
      }
      if (table === "appointments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: existing }),
          update: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            updates.push(row);
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            auditInserts.push(row);
            return Promise.resolve({ error: null });
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("Appointments detail", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    updates.length = 0;
    auditInserts.length = 0;
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("GET returns the appointment with checklist", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { GET } = await import("@/app/api/appointments/[id]/route");
    const res = await GET(
      new Request("http://localhost/api/appointments/appt-1"),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.pre_visit_checklist)).toBe(true);
    expect(body.pre_visit_checklist).toHaveLength(2);
  });

  it("PATCH toggling a checklist item → 200 and persisted", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import("@/app/api/appointments/[id]/route");
    const nextChecklist = [
      { text: "Ask about CA 19-9", checked: true },
      { text: "Review imaging", checked: false },
    ];
    const res = await PATCH(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pre_visit_checklist: nextChecklist }),
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(200);
    expect(updates[0].pre_visit_checklist).toEqual(nextChecklist);
  });

  it("PATCH post_visit_notes → 200 and persisted", async () => {
    createClient.mockResolvedValue(makeSupabase({}));
    const { PATCH } = await import("@/app/api/appointments/[id]/route");
    const res = await PATCH(
      new Request("http://localhost/api/appointments/appt-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_visit_notes: "Scan looked stable." }),
      }),
      { params: Promise.resolve({ id: "appt-1" }) }
    );
    expect(res.status).toBe(200);
    expect(updates[0].post_visit_notes).toBe("Scan looked stable.");
  });
});
