"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function friendlyOnboardingError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("duplicate") || lower.includes("unique constraint") || lower.includes("already exists")) {
    return "A profile already exists for this account. Try refreshing the page.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch") || lower.includes("load failed")) {
    return "Could not connect. Please check your internet connection and try again.";
  }
  return msg;
}

type Role = "caregiver" | "patient" | "provider";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("caregiver");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      // Step 1: verify auth session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Step 2: check whether the handle_new_user trigger already created
      // a public.users row with an organization_id
      const { data: userRecord } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      let organizationId: string | null = userRecord?.organization_id ?? null;

      // Step 4: fallback for race condition or legacy accounts where the
      // trigger did not run -- create the org and link the user manually
      if (!organizationId) {
        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({ name: "Personal" })
          .select("id")
          .single();

        if (newOrg?.id) {
          organizationId = newOrg.id;
          await supabase
            .from("users")
            .upsert(
              { id: user.id, email: user.email, organization_id: organizationId, role: "caregiver" },
              { onConflict: "id" }
            );
        }
      }

      if (!organizationId) {
        setError("Something went wrong setting up your account. Please try again.");
        setLoading(false);
        return;
      }

      // Step 5: persist role and display name chosen during onboarding
      await supabase
        .from("users")
        .update({ role, full_name: user.user_metadata?.full_name || null })
        .eq("id", user.id);

      // Step 6: create first patient record for caregiver and patient roles
      if (role === "caregiver" || role === "patient") {
        const { error: insertError } = await supabase.from("patients").insert({
          name,
          dob: dob || null,
          sex: sex || null,
          custom_diagnosis: diagnosis || null,
          diagnosis_date: diagnosisDate || null,
          organization_id: organizationId,
          created_by: user.id,
          status: "active",
        });

        if (insertError) {
          setError(friendlyOnboardingError(insertError.message));
          setLoading(false);
          return;
        }
      }

      // Step 7: onboarding complete
      router.push("/home");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(friendlyOnboardingError(msg));
      setLoading(false);
    }
  }

  const inputStyle = {
    height: 52,
    borderRadius: 12,
    border: "1.5px solid #E8E2D9",
    padding: "0 16px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: 16,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
    width: "100%",
    outline: "none",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B6B6B' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    paddingRight: 40,
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#F7F2EA" }}
    >
      <div className="w-full" style={{ maxWidth: 400 }}>
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/clarifer-logo.png" alt="Clarifer" width={48} height={48} style={{ objectFit: "contain" }} />
        </div>

        <h1
          className="mt-4 text-center"
          style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "#1A1A1A" }}
        >
          Set up your profile
        </h1>
        <p
          className="mt-1 text-center"
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#6B6B6B" }}
        >
          Step {step} of 2
        </p>

        <div
          className="mt-6"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {step === 1 && (
            <>
              <h2
                style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "#1A1A1A" }}
              >
                Tell us about you
              </h2>
              <p
                className="mt-1"
                style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#6B6B6B" }}
              >
                Choose the description that fits best.
              </p>

              <div className="mt-5 space-y-4">
                <RolePicker selected={role} onSelect={setRole} />

                <h3
                  style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "#1A1A1A", marginTop: 24 }}
                >
                  Patient information
                </h3>

                <div>
                  <label
                    htmlFor="name"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}
                  >
                    Patient name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    className="mt-1.5"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="dob"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}
                  >
                    Date of birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1.5"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="sex"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}
                  >
                    Sex
                  </label>
                  <select
                    id="sex"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="mt-1.5"
                    style={selectStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
                  >
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="flex w-full items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: "#2C5F4A",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2
                style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "#1A1A1A" }}
              >
                Condition details
              </h2>
              <p
                className="mt-1"
                style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#6B6B6B" }}
              >
                This helps Clarifer personalize your experience
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="diagnosis"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}
                  >
                    Primary diagnosis
                  </label>
                  <input
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g., Lupus, Crohn's, MS..."
                    className="mt-1.5"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="diagDate"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}
                  >
                    Date of diagnosis
                  </label>
                  <input
                    id="diagDate"
                    type="date"
                    value={diagnosisDate}
                    onChange={(e) => setDiagnosisDate(e.target.value)}
                    className="mt-1.5"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      backgroundColor: "#FDF3EE",
                      borderLeft: "3px solid #C4714A",
                      padding: "12px 16px",
                      borderRadius: 8,
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: 14,
                      color: "#C4714A",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex flex-1 items-center justify-center transition-opacity hover:opacity-90"
                    style={{
                      height: 52,
                      borderRadius: 26,
                      border: "1.5px solid #E8E2D9",
                      backgroundColor: "#FFFFFF",
                      color: "#1A1A1A",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: "#2C5F4A",
                      color: "#FFFFFF",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Get started
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface RoleOption {
  value: Role;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "caregiver",
    title: "I am a caregiver",
    subtitle: "I care for a family member or loved one",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    value: "patient",
    title: "I am managing my own care",
    subtitle: "I have a condition and track my own health",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  },
  {
    value: "provider",
    title: "I am a healthcare provider",
    subtitle: "I support patients in a clinical setting",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3h4v6h6v4h-6v6h-4v-6H4V9h6V3z" />
      </svg>
    ),
  },
];

function RolePicker({
  selected,
  onSelect,
}: {
  selected: Role;
  onSelect: (r: Role) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose your role"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {ROLE_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.title}
            onClick={() => onSelect(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minHeight: 64,
              padding: "12px 16px",
              borderRadius: 16,
              border: isSelected ? "2px solid #2C5F4A" : "1.5px solid #E8E2D9",
              backgroundColor: isSelected ? "#F0F5F2" : "#FFFFFF",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--font-dm-sans)",
              transition: "background-color 120ms, border-color 120ms",
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isSelected ? "#FFFFFF" : "#F0F5F2",
                color: "#2C5F4A",
                flexShrink: 0,
              }}
            >
              {opt.icon}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 16, color: "#1A1A1A" }}>{opt.title}</span>
              <span style={{ fontWeight: 400, fontSize: 13, color: "#6B6B6B" }}>{opt.subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
