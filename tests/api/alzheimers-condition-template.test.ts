/**
 * Sprint 2B — Alzheimer's Condition Template
 * Test 1: Alzheimer's condition template loads correctly for elderly parent persona
 * Test 3: Logged symptoms are scoped to alzheimers condition_template_id and queryable
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEST_CAREGIVER } from "../fixtures/users";

vi.mock("@/lib/cors", () => ({ checkOrigin: vi.fn().mockReturnValue(null) }));

const ALZHEIMERS_TEMPLATE = {
  id: "alzheimers",
  name: "Alzheimer's Disease",
  category: "neurology",
  ai_context: "alzheimers disease, progressive neurodegeneration, memory loss, word-finding difficulty, elderly parent caregiver",
  symptom_questions: [
    { key: "memory_loss",            label: "Memory loss",               type: "scale",    min: 1, max: 10 },
    { key: "word_finding_difficulty",label: "Word-finding difficulty",   type: "scale",    min: 1, max: 10 },
    { key: "confusion",              label: "Confusion / disorientation",type: "scale",    min: 1, max: 10 },
    { key: "sleep_disruption",       label: "Sleep disruption",          type: "scale",    min: 1, max: 10 },
    { key: "caregiver_stress",       label: "Caregiver stress level",    type: "scale",    min: 1, max: 10 },
    { key: "mood_changes",           label: "Mood changes",              type: "checkbox", options: ["depression", "anxiety", "irritability", "apathy"] },
    { key: "behavioral_changes",     label: "Behavioral changes",        type: "checkbox", options: ["aggression", "wandering", "repetition", "agitation"] },
  ],
  symptom_vocabulary: [
    "memory_loss", "word_finding_difficulty", "confusion", "disorientation",
    "wandering", "behavioral_changes", "eating_changes", "sleep_disruption", "mood_changes",
  ],
  trial_filters: {
    common_medications: ["donepezil", "rivastigmine", "memantine", "aricept", "exelon"],
  },
  is_active: true,
};

function makeMockSupabase(userOverride: unknown, roleOverride: unknown, templateData: unknown = ALZHEIMERS_TEMPLATE) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  const symptomLogInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "log-alzheimers-1" }, error: null }),
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

describe("GET /api/condition-templates/[id] — alzheimers template", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("returns alzheimers condition template with all required fields for elderly parent persona", async () => {
    createClient.mockResolvedValue(
      makeMockSupabase({ id: TEST_CAREGIVER.id }, { role: "caregiver", organization_id: "test-org-ccf-demo" })
    );

    const { GET } = await import("@/app/api/condition-templates/[id]/route");
    const req = new Request("http://localhost/api/condition-templates/alzheimers");
    const params = Promise.resolve({ id: "alzheimers" });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.id).toBe("alzheimers");
    expect(body.name).toBe("Alzheimer's Disease");
    expect(body.category).toBe("neurology");
    expect(body.is_active).toBe(true);

    // Alzheimer's-specific: must include word_finding_difficulty (distinguishes from generic dementia)
    const fields = (body.symptom_questions as Array<{ key: string }>) ?? [];
    const keys = fields.map((f) => f.key);
    expect(keys).toContain("memory_loss");
    expect(keys).toContain("word_finding_difficulty");
    expect(keys).toContain("confusion");
    expect(keys).toContain("sleep_disruption");
    expect(keys).toContain("caregiver_stress");
    expect(keys).toContain("mood_changes");
    expect(keys).toContain("behavioral_changes");

    // Mood changes options
    const moodField = fields.find((f) => f.key === "mood_changes") as { options?: string[] } | undefined;
    expect(moodField?.options).toContain("depression");
    expect(moodField?.options).toContain("anxiety");
    expect(moodField?.options).toContain("apathy");

    expect(body.ai_context).toMatch(/alzheimer/i);
  });
});

// ─── Test 3: symptom log API ───────────────────────────────────────────────────

describe("POST /api/symptoms/log — alzheimers scope", () => {
  let createClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/server");
    createClient = mod.createClient as ReturnType<typeof vi.fn>;
  });

  it("logs symptoms scoped to alzheimers condition_template_id and writes audit_log", async () => {
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
        patientId: "test-patient-margaret",
        conditionTemplateId: "alzheimers",
        responses: {
          memory_loss: 8,
          word_finding_difficulty: 7,
          confusion: 6,
          sleep_disruption: 5,
          caregiver_stress: 9,
          mood_changes: ["apathy", "anxiety"],
          behavioral_changes: ["repetition"],
        },
        overallSeverity: 8,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("log-alzheimers-1");

    // condition_context must be scoped to alzheimers
    expect(mock._symptomLogInsert).toHaveBeenCalledOnce();
    const insertArg = mock._symptomLogInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.condition_context).toBe("alzheimers");
    expect(insertArg.patient_id).toBe("test-patient-margaret");
    expect(insertArg.overall_severity).toBe(8);

    // Audit log — HIPAA Tier 1
    expect(mock._auditInsert).toHaveBeenCalledOnce();
    const auditArg = mock._auditInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(auditArg.action).toBe("symptom_logged");
    expect(auditArg.user_id).toBe(TEST_CAREGIVER.id);
    expect(auditArg.patient_id).toBe("test-patient-margaret");
    expect(auditArg.resource_type).toBe("symptom_logs");
  });
});
