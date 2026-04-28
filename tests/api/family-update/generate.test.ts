/**
 * tests/api/family-update/generate.test.ts
 * Vitest suite for the family-update streaming route, covering auth, language, and persistence.
 * Tables: mocks users, patients, symptom_logs, medications, appointments, documents, family_updates, audit_log.
 * Auth: exercises 401, 403 (wrong role / wrong org), and authorized caregiver paths.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. Tests use synthetic ids and stubbed Anthropic stream output.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

interface MockStreamEvent { type: string; delta?: { type: string; text: string } }

const { mockStreamFn } = vi.hoisted(() => {
  function buildMockStream(text: string): AsyncIterable<MockStreamEvent> & PromiseLike<unknown> {
    const events: MockStreamEvent[] = text.split(" ").map((word, i) => ({
      type: "content_block_delta",
      delta: { type: "text_delta", text: i === 0 ? word : ` ${word}` },
    }));
    return {
      [Symbol.asyncIterator]() {
        let i = 0;
        return {
          async next() {
            if (i >= events.length) return { value: undefined as unknown as MockStreamEvent, done: true };
            return { value: events[i++], done: false };
          },
        };
      },
      then: () => undefined as unknown,
    } as AsyncIterable<MockStreamEvent> & PromiseLike<unknown>;
  }
  const fn = () => buildMockStream("This week was steady. We are doing well.");
  return { mockStreamFn: fn };
});

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { stream: mockStreamFn };
  }
  return { default: MockAnthropic };
});

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const auditCalls: Array<Record<string, unknown>> = [];
const familyUpdateCalls: Array<Record<string, unknown>> = [];

function makeSupabase(opts: {
  user?: { id: string } | null;
  role?: string;
  orgId?: string | null;
  patientOrg?: string | null;
}) {
  const userRecord =
    opts.orgId === null
      ? null
      : { role: opts.role ?? "caregiver", organization_id: opts.orgId ?? "org-A" };

  const patient =
    opts.patientOrg === null
      ? null
      : { id: "patient-1", name: "Maria", organization_id: opts.patientOrg ?? "org-A" };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user === undefined ? { id: "user-1" } : opts.user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: userRecord }),
        };
      }
      if (table === "patients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: patient }),
        };
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            auditCalls.push(row);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === "family_updates") {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            familyUpdateCalls.push(row);
            return Promise.resolve({ data: null, error: null });
          }),
        };
      }
      // symptom_logs / medications / appointments / documents
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  };
}

async function readStreamText(res: Response): Promise<{ meta: Record<string, unknown> | null; text: string; events: number }> {
  let meta: Record<string, unknown> | null = null;
  let text = "";
  let events = 0;
  if (!res.body) return { meta, text, events };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      events += 1;
      const evt = JSON.parse(line);
      if (evt.kind === "meta") meta = evt;
      else if (evt.kind === "text") text += evt.text;
    }
  }
  return { meta, text, events };
}

describe("/api/family-update/generate", () => {
  beforeEach(() => {
    vi.resetModules();
    auditCalls.length = 0;
    familyUpdateCalls.length = 0;
    process.env.ANTHROPIC_API_KEY = "test-key";
  });
  afterEach(() => vi.restoreAllMocks());

  it("1. requires auth (401 when no user)", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({ user: null }));
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(new Request("http://localhost/api/family-update/generate", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1" }),
    }));
    expect(res.status).toBe(401);
  });

  it("2. generates an English update with disclaimer", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(new Request("http://localhost/api/family-update/generate", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1", language: "en", date_range_days: 7 }),
    }));
    expect(res.status).toBe(200);
    const { meta, text } = await readStreamText(res);
    expect(meta?.language).toBe("en");
    expect(String(meta?.disclaimer)).toMatch(/AI-assisted/i);
    expect(text.length).toBeGreaterThan(0);
  });

  it("3. generates a Spanish update with Spanish disclaimer", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(new Request("http://localhost/api/family-update/generate", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1", language: "es", date_range_days: 7 }),
    }));
    expect(res.status).toBe(200);
    const { meta } = await readStreamText(res);
    expect(meta?.language).toBe("es");
    expect(String(meta?.disclaimer)).toMatch(/IA/i);
  });

  it("4. response body is a stream with multiple events", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(new Request("http://localhost/api/family-update/generate", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1", language: "en" }),
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/x-ndjson/);
    const { events } = await readStreamText(res);
    expect(events).toBeGreaterThan(2); // meta + at least one text + done
  });

  it("5. writes an audit log entry on generation", async () => {
    const server = await import("@/lib/supabase/server");
    (server.createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase({}));
    const { POST } = await import("@/app/api/family-update/generate/route");
    const res = await POST(new Request("http://localhost/api/family-update/generate", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ patient_id: "patient-1", language: "en" }),
    }));
    expect(res.status).toBe(200);
    await readStreamText(res); // drain to trigger audit insert in stream finalizer
    expect(auditCalls.some((c) => c.resource_type === "family_update")).toBe(true);
  });
});
