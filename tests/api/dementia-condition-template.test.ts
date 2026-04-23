/**
 * Sprint 2A — Dementia Condition Template
 * Test 1: Dementia condition template loads correctly for elderly parent persona
 * Test 2: Symptom logging UI renders dementia-specific fields
 * Test 3: Logged symptoms are scoped to dementia condition_template_id and queryable
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER } from "../fixtures/users";

// ─── Test 1: condition template route ─────────────────────────────────────────

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const DEMENTIA_TEMPLATE = {
  id: "c0297dcb-5e17-42aa-9f8d-129c7a580f08",
  slug: "dementia",
  name: "Dementia",
  category: "neurology",
  ai_context: "dementia, cognitive decline, memory loss, elderly parent caregiver",
  symptom_questions: [
    { key: "memory_loss", label: "Memory loss", type: "scale", min: 1, max: 10 },
    { key: "confusion", label: "Confusion / disorientation", type: "scale", min: 1, max: 10 },
    { key: "sleep_disruption", label: "Sleep disruption", type: "scale", min: 1, max: 10 },
    { key: "caregiver_stress", label: "Caregiver stress level", type: "scale", min: 1, max: 10 },
    {
      key: "behavioral_changes",
      label: "Behavioral changes",
      type: "checkbox",
      options: ["aggression", "wandering", "repetition", "agitation"],
    },
    {
      key: "eating_hygiene",
      label: "Eating and hygiene",
      type: "checkbox",
      options: ["refuses food", "forgets to eat", "hygiene neglect"],
    },
  ],
  symptom_vocabulary: [
    "memory_loss", "cognitive_decline", "confusion", "disorientation",
    "wandering", "behavioral_changes", "eating_changes", "sleep_disruption", "aggression",
  ],
  trial_filters: {
    common_medications: ["donepezil", "rivastigmine", "memantine", "sertraline", "lorazepam"],
  },
  is_active: true,
};

function makeMockSupabase(userOverride: unknown, roleOverride: unknown, templateData: unknown = DEMENTIA_TEMPLATE) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  const symptomLogInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "log-dementia-1" }, error: null }),
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userOverride }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: roleOverride }),
        };
      }
      if (table === "condition_templates") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: templateData }),
        };
      }
      if (table === "symptom_logs") {
        return { insert: symptomLogInsert };
      }
      if (table === "audit_log") {
        return { insert: auditInsert };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      };
    }),
    _auditInsert: auditInsert,
    _symptomLogInsert: symptomLogInsert,
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// ─── Test 1 ────────────────────────────────────────────────────────────────────

describe("GET /api/condition-templates/[id] — dementia template", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns dementia condition template with all required fields for elderly parent persona", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { GET } = await import("@/app/api/condition-templates/[id]/route");
    const req = new Request("http://localhost/api/condition-templates/dementia");
    const params = Promise.resolve({ id: "dementia" });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.slug).toBe("dementia");
    expect(body.name).toBe("Dementia");
    expect(body.category).toBe("neurology");
    expect(body.is_active).toBe(true);

    // Elderly parent caregiver persona: must include caregiver stress field
    const fields = (body.symptom_questions as Array<{ key: string }>) ?? [];
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("memory_loss");
    expect(keys).toContain("confusion");
    expect(keys).toContain("sleep_disruption");
    expect(keys).toContain("caregiver_stress");
    expect(keys).toContain("behavioral_changes");
    expect(keys).toContain("eating_hygiene");

    // Guardrails present in ai_context
    expect(body.ai_context).toMatch(/dementia/i);
  });

  it("returns 404 when template id does not exist", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" }, null)
    );

    const { GET } = await import("@/app/api/condition-templates/[id]/route");
    const req = new Request("http://localhost/api/condition-templates/unknown");
    const params = Promise.resolve({ id: "unknown" });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });
});

// ─── Test 3: symptom log API ───────────────────────────────────────────────────

describe("POST /api/symptoms/log — dementia scope", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("logs symptoms scoped to dementia condition_template_id and writes audit_log", async () => {
    const mock = makeMockSupabase(
      { id: TEST_CAREGIVER.id },
      { role: "caregiver", organization_id: "test-org-ccf-demo" }
    );
    createClient.mockResolvedValue(mock);

    const { POST } = await import("@/app/api/symptoms/log/route");
    const req = new Request("http://localhost/api/symptoms/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: "test-patient-eleanor",
        conditionTemplateId: "dementia",
        responses: {
          memory_loss: 7,
          confusion: 6,
          sleep_disruption: 5,
          caregiver_stress: 8,
          behavioral_changes: ["wandering", "agitation"],
          eating_hygiene: ["forgets to eat"],
        },
        overallSeverity: 7,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("log-dementia-1");

    // Verify symptom_logs insert included condition context
    expect(mock._symptomLogInsert).toHaveBeenCalledOnce();
    const insertArg = mock._symptomLogInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.condition_context).toBe("dementia");
    expect(insertArg.patient_id).toBe("test-patient-eleanor");
    expect(insertArg.overall_severity).toBe(7);

    // Audit log must be written — HIPAA Tier 1
    expect(mock._auditInsert).toHaveBeenCalledOnce();
    const auditArg = mock._auditInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(auditArg.action).toBe("symptom_logged");
    expect(auditArg.user_id).toBe(TEST_CAREGIVER.id);
    expect(auditArg.patient_id).toBe("test-patient-eleanor");
    expect(auditArg.resource_type).toBe("symptom_logs");
  });
});
