"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Loader2 } from "lucide-react";

const COLOR_CHIPS = [
  { value: 1, label: "Very mild", bg: "#E3F2FD", color: "#0D3B6E" },
  { value: 2, label: "Mild", bg: "#FEF8E1", color: "#5C3D00" },
  { value: 3, label: "Moderate", bg: "#FEF0E1", color: "#7A3B00" },
  { value: 4, label: "Significant", bg: "#FDECEA", color: "#8B1A1A" },
  { value: 5, label: "Severe", bg: "#F5E0DE", color: "#5C0F0F" },
];

const SENSATION_CHIPS = [
  "Pressure", "Burning", "Sharp",
  "Throbbing", "Deep inside", "On the skin",
  "Cramping", "Tingling", "Achy",
];

const TIMING_CHIPS = ["All day", "Morning", "After eating", "At night", "Comes and goes"];

const FUNCTIONAL_OPTIONS = [
  "Active as usual",
  "Slowing down a bit",
  "Limited but managing",
  "Needs help to stand or walk",
  "Stayed in bed",
];

const APPETITE_OPTIONS = [
  "Eating normally",
  "Eating less than usual",
  "Small bites only",
  "Barely eating",
  "Not eating",
];

const INFECTION_SIGNS = [
  "Fever or chills",
  "Swelling or redness at wound or port site",
  "Unusual discharge",
  "New or worsening cough",
  "Painful urination",
];

const LOW_APPETITE = new Set(["Barely eating", "Not eating"]);
const HIGH_RISK_FUNCTIONAL = new Set(["Needs help to stand or walk", "Stayed in bed"]);

function SectionCard({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: "20px 16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 12,
        }}
      >
        {title}
        {required && <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>}
      </p>
      {children}
    </div>
  );
}

function Alert({ bg, textColor, message }: { bg: string; textColor: string; message: string }) {
  return (
    <div
      style={{
        marginTop: 12,
        backgroundColor: bg,
        borderRadius: 8,
        padding: "12px 16px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: 13,
          color: textColor,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
    </div>
  );
}

export default function LogPage() {
  const [colorValue, setColorValue] = useState<number | null>(null);
  const [sensations, setSensations] = useState<string[]>([]);
  const [timing, setTiming] = useState<string[]>([]);
  const [functionalStatus, setFunctionalStatus] = useState<string | null>(null);
  const [appetite, setAppetite] = useState<string | null>(null);
  const [infectionSigns, setInfectionSigns] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastAppetite, setLastAppetite] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: patient }, { data: me }] = await Promise.all([
        supabase.from("patients").select("id").eq("created_by", user.id).limit(1).single(),
        supabase.from("users").select("organization_id").eq("id", user.id).single(),
      ]);

      if (patient) setPatientId(patient.id);
      if (me?.organization_id) setOrganizationId(me.organization_id);

      if (patient) {
        const { data: lastLog } = await supabase
          .from("symptom_logs")
          .select("responses")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (
          lastLog?.responses &&
          typeof lastLog.responses === "object" &&
          !Array.isArray(lastLog.responses)
        ) {
          const r = lastLog.responses as Record<string, unknown>;
          setLastAppetite(typeof r.appetite === "string" ? r.appetite : null);
        }
      }
    }
    init();
  }, [supabase]);

  function toggleMulti(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const showFunctionalAlert = functionalStatus !== null && HIGH_RISK_FUNCTIONAL.has(functionalStatus);
  const showAppetiteAlert =
    appetite !== null &&
    LOW_APPETITE.has(appetite) &&
    lastAppetite !== null &&
    LOW_APPETITE.has(lastAppetite);
  const showInfectionAlert = infectionSigns.length > 0;

  const canSave = colorValue !== null && functionalStatus !== null && appetite !== null;

  async function handleSave() {
    if (!canSave || !patientId || !organizationId || !userId) return;
    setSaving(true);

    await supabase.from("symptom_logs").insert({
      patient_id: patientId,
      logged_by: userId,
      organization_id: organizationId,
      symptoms: sensations,
      overall_severity: colorValue,
      responses: {
        color_value: colorValue,
        sensations,
        timing,
        functional_status: functionalStatus,
        appetite,
        infection_signs: infectionSigns,
        notes: notes.trim() || null,
      },
    });

    setSaving(false);
    router.push("/home");
  }

  const chipBase: React.CSSProperties = {
    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
  };

  return (
    <PageContainer>
      <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 20,
          }}
        >
          How are they feeling?
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Section 1: Color scale */}
          <SectionCard title="How would you describe the overall level?" required>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {COLOR_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setColorValue(colorValue === chip.value ? null : chip.value)}
                  style={{
                    ...chipBase,
                    minHeight: 52,
                    borderRadius: 10,
                    outline: colorValue === chip.value ? `2px solid ${chip.color}` : "2px solid transparent",
                    outlineOffset: -2,
                    backgroundColor: chip.bg,
                    color: chip.color,
                    fontSize: 15,
                    fontWeight: colorValue === chip.value ? 600 : 400,
                    padding: "0 16px",
                    textAlign: "left",
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Section 2: Sensation */}
          <SectionCard title="What type of sensation? (optional)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {SENSATION_CHIPS.map((s) => {
                const active = sensations.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleMulti(sensations, setSensations, s)}
                    style={{
                      ...chipBase,
                      minHeight: 52,
                      borderRadius: 10,
                      border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                      backgroundColor: active ? "var(--pale-sage)" : "var(--background)",
                      color: active ? "var(--primary)" : "var(--text)",
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      padding: "8px 6px",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Section 3: Timing */}
          <SectionCard title="When does it happen? (optional)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIMING_CHIPS.map((t) => {
                const active = timing.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleMulti(timing, setTiming, t)}
                    style={{
                      ...chipBase,
                      minHeight: 52,
                      borderRadius: 26,
                      border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                      backgroundColor: active ? "var(--pale-sage)" : "var(--background)",
                      color: active ? "var(--primary)" : "var(--text)",
                      fontSize: 14,
                      fontWeight: active ? 500 : 400,
                      padding: "0 16px",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Section 4: Functional status */}
          <SectionCard title="How are they getting around today?" required>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FUNCTIONAL_OPTIONS.map((opt) => {
                const active = functionalStatus === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFunctionalStatus(active ? null : opt)}
                    style={{
                      ...chipBase,
                      minHeight: 52,
                      borderRadius: 10,
                      border: active
                        ? "2px solid var(--primary)"
                        : "1.5px solid var(--border)",
                      backgroundColor: active ? "var(--pale-sage)" : "var(--card)",
                      color: "var(--text)",
                      fontSize: 15,
                      fontWeight: active ? 600 : 400,
                      padding: "0 16px",
                      textAlign: "left",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {showFunctionalAlert && (
              <Alert
                bg="var(--pale-terra)"
                textColor="var(--accent)"
                message="This level of difficulty moving is worth noting to the care team. If this is a sudden change, call their nurse line."
              />
            )}
          </SectionCard>

          {/* Section 5: Appetite */}
          <SectionCard title="How is their appetite?" required>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {APPETITE_OPTIONS.map((opt) => {
                const active = appetite === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAppetite(active ? null : opt)}
                    style={{
                      ...chipBase,
                      minHeight: 52,
                      borderRadius: 10,
                      border: active
                        ? "2px solid var(--primary)"
                        : "1.5px solid var(--border)",
                      backgroundColor: active ? "var(--pale-sage)" : "var(--card)",
                      color: "var(--text)",
                      fontSize: 15,
                      fontWeight: active ? 600 : 400,
                      padding: "0 16px",
                      textAlign: "left",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {showAppetiteAlert && (
              <Alert
                bg="var(--pale-terra)"
                textColor="var(--accent)"
                message="This is the second log in a row with very low appetite. Poor nutrition can affect treatment tolerance. Consider mentioning this at the next visit."
              />
            )}
          </SectionCard>

          {/* Section 6: Infection signs */}
          <SectionCard title="Any of these signs? (optional)">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {INFECTION_SIGNS.map((sign) => (
                <label
                  key={sign}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 48,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 15,
                    color: "var(--text)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={infectionSigns.includes(sign)}
                    onChange={() => toggleMulti(infectionSigns, setInfectionSigns, sign)}
                    style={{
                      width: 20,
                      height: 20,
                      accentColor: "var(--primary)",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  {sign}
                </label>
              ))}
            </div>
            {showInfectionAlert && (
              <Alert
                bg="#FDECEA"
                textColor="#8B1A1A"
                message="These signs may indicate infection. If you are concerned, call the care team or go to the nearest emergency room."
              />
            )}
          </SectionCard>

          {/* Section 7: Notes */}
          <SectionCard title="Anything else to note? (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Triggers, medications taken, context..."
              style={{
                width: "100%",
                minHeight: 80,
                borderRadius: 10,
                border: "1.5px solid var(--border)",
                padding: "12px 14px",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 15,
                color: "var(--text)",
                backgroundColor: "var(--background)",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </SectionCard>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              height: 56,
              borderRadius: 28,
              backgroundColor: canSave && !saving ? "var(--primary)" : "var(--border)",
              color: canSave && !saving ? "#FFFFFF" : "var(--muted)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              border: "none",
              cursor: canSave && !saving ? "pointer" : "not-allowed",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {saving ? (
              <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
            ) : (
              "Save log"
            )}
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
