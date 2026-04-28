/**
 * tests/api/care-team/message-templates.test.ts
 * Tests for GET/POST /api/care-team/[id]/message-templates.
 * Tables: mocks users, care_team, care_team_message_templates, audit_log.
 * Auth: org-scoped via parent care_team row; cross-tenant returns 404.
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: No PHI in test fixtures.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

interface State {
  templates: Array<Record<string, unknown>>;
  audits: Array<Record<string, unknown>>;
}

function makeSupabase(opts: {
  role?: string;
  userOrg?: string | null;
  memberOrg?: string | null;
  state: State;
}) {
  const userOrg = opts.userOrg ?? "org-A";
  const memberOrg = opts.memberOrg === undefined ? userOrg : opts.memberOrg;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { role: opts.role ?? "caregiver", organization_id: userOrg },
          }),
        };
      }
      if (table === "care_team") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string) => {
            if (col === "organization_id") {
              return {
                single: vi
                  .fn()
                  .mockResolvedValue({ data: memberOrg === userOrg ? { id: "ct-1", patient_id: "pat-1" } : null }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: memberOrg === userOrg ? { id: "ct-1", patient_id: "pat-1" } : null }),
              }),
            };
          }),
        };
      }
      if (table === "care_team_message_templates") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: opts.state.templates, error: null }),
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            const created = { ...row, id: "tpl-new-1" };
            opts.state.templates.push(created);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: created, error: null }),
              }),
            };
          }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            opts.state.audits.push(row);
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {};
    }),
  };
}

describe("/api/care-team/[id]/message-templates", () => {
  beforeEach(() => vi.resetModules());

  it("17. GET returns templates for member", async () => {
    const state: State = {
      templates: [{ id: "tpl-1", label: "Refill request", body: "Please refill...", care_team_member_id: "ct-1" }],
      audits: [],
    };
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({ state }));
    const { GET } = await import("@/app/api/care-team/[id]/message-templates/route");
    const res = await GET(
      new Request("http://localhost/api/care-team/ct-1/message-templates", {
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "ct-1" }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.templates).toHaveLength(1);
    expect(json.templates[0].label).toBe("Refill request");
  });

  it("18. POST creates a template and writes audit_log", async () => {
    const state: State = { templates: [], audits: [] };
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({ state }));
    const { POST } = await import("@/app/api/care-team/[id]/message-templates/route");
    const res = await POST(
      new Request("http://localhost/api/care-team/ct-1/message-templates", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ label: "Refill request", body: "Please refill the prescription." }),
      }),
      { params: Promise.resolve({ id: "ct-1" }) }
    );
    expect(res.status).toBe(201);
    expect(state.templates).toHaveLength(1);
    expect(state.audits.some((a) => a.resource_type === "care_team_message_templates")).toBe(true);
  });

  it("19. cross-tenant member_id returns 404", async () => {
    const state: State = { templates: [], audits: [] };
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ state, userOrg: "org-A", memberOrg: "org-B" })
    );
    const { GET } = await import("@/app/api/care-team/[id]/message-templates/route");
    const res = await GET(
      new Request("http://localhost/api/care-team/ct-foreign/message-templates", {
        headers: { origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "ct-foreign" }) }
    );
    expect(res.status).toBe(404);
  });
});
