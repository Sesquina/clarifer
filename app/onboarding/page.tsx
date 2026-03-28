"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("patients").insert({
      name,
      dob: dob || null,
      sex: sex || null,
      custom_diagnosis: diagnosis || null,
      diagnosis_date: diagnosisDate || null,
      created_by: user.id,
      status: "active",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
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
          <svg viewBox="0 0 24 24" fill="none" stroke="#2C5F4A" strokeWidth="2" width="48" height="48">
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="22" />
            <path d="M5 15l7 7 7-7" />
            <path d="M5 12h4M15 12h4" />
          </svg>
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
                Patient information
              </h2>
              <p
                className="mt-1"
                style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#6B6B6B" }}
              >
                Who are you managing care for?
              </p>

              <div className="mt-5 space-y-4">
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
                This helps Medalyn personalize your experience
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
