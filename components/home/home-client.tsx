"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Activity, MessageCircle, UploadCloud, Search, Calendar, MapPin, Plus, X, Loader2, Copy, Check } from "lucide-react";

const CAREGIVER_MESSAGES = [
  "Have you had water today?",
  "When did you last eat a real meal?",
  "It is okay to not have all the answers.",
  "You are doing more than you know.",
  "Is there someone you can call today, just to talk?",
  "Step outside for 10 minutes if you can.",
  "Rest is not giving up. Rest is how you keep going.",
  "You do not have to be strong every minute.",
  "It is okay to feel overwhelmed. This is overwhelming.",
  "PATIENT_NAME is lucky to have you.",
  "Have you slept? Even a little?",
  "One thing at a time. Just today.",
  "You are allowed to ask for help.",
  "Breathing slowly actually helps. Try it right now.",
  "You showed up today. That matters.",
  "Is there anything you need that no one has asked about?",
  "The hard moments do not erase the good ones.",
  "You can fall apart sometimes. You always put yourself back together.",
  "Drink some water. Seriously.",
  "What would you tell a friend in your position? Tell yourself that.",
  "You are not alone in this, even when it feels that way.",
  "Small wins count. What was yours today?",
  "It is okay to laugh. Joy does not mean you are not taking this seriously.",
  "You have carried a lot. Put something down today if you can.",
  "Has anyone checked on you today? We are checking on you.",
  "Even 5 minutes of quiet is worth taking.",
  "You are the expert on PATIENT_NAME. Trust yourself.",
  "Grief and love can exist at the same time.",
  "You do not have to explain your feelings to anyone today.",
  "We see you. Keep going.",
];

interface HomeClientProps {
  patient: { id: string; name: string; diagnosis: string | null };
  statusLine: string;
  logs: Array<{ id: string; created_at: string | null; overall_severity: number | null; ai_summary: string | null; [key: string]: unknown }>;
  appointments: Array<{ id: string; title: string | null; datetime: string | null; location: string | null; provider_name?: string | null }>;
  loggedToday: boolean;
}

export function HomeClient({ patient, statusLine, logs, appointments, loggedToday }: HomeClientProps) {
  const [showApptModal, setShowApptModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Appointment form
  const [apptTitle, setApptTitle] = useState("");
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptLocation, setApptLocation] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [apptSaving, setApptSaving] = useState(false);

  const supabase = createClient();
  const dayIndex = new Date().getDate() % 30;
  const caregiverMsg = CAREGIVER_MESSAGES[dayIndex].replace(/PATIENT_NAME/g, patient.name);

  async function handleFamilyUpdate() {
    setShowUpdateModal(true);
    setUpdateLoading(true);
    setUpdateText("");
    try {
      const res = await fetch("/api/family-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id }),
      });

      if (!res.ok) {
        setUpdateText("Could not generate update. Please try again.");
        setUpdateLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setUpdateText("Could not generate update. Please try again.");
        setUpdateLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let text = "";
      setUpdateLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const captured = text;
        setUpdateText(captured);
      }
    } catch {
      setUpdateText("Something went wrong. Please try again.");
      setUpdateLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(updateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveAppt() {
    if (!apptTitle.trim() || !apptDate) return;
    setApptSaving(true);
    const datetime = apptTime ? `${apptDate}T${apptTime}:00` : `${apptDate}T09:00:00`;
    await supabase.from("appointments").insert({
      patient_id: patient.id,
      title: apptTitle,
      provider_name: apptDoctor || null,
      location: apptLocation || null,
      datetime,
      notes: apptNotes || null,
    });
    setApptSaving(false);
    setShowApptModal(false);
    setApptTitle("");
    setApptDoctor("");
    setApptLocation("");
    setApptDate("");
    setApptTime("");
    setApptNotes("");
    window.location.reload();
  }

  const inputStyle: React.CSSProperties = {
    height: 48,
    borderRadius: 12,
    border: "1.5px solid #E8E2D9",
    padding: "0 16px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Greeting */}
        <div>
          <p style={{ fontSize: 14, color: "#2C5F4A", fontWeight: 500 }}>
            Caring for {patient.name}
          </p>
          <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>
            {statusLine}
          </p>
        </div>

        {/* Caregiver check-in */}
        <Link href="/log" style={{ textDecoration: "none" }}>
          <div
            style={{
              backgroundColor: "#F7F2EA",
              border: "1.5px solid #C4714A",
              borderRadius: 16,
              padding: "20px 20px",
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
              How is {patient.name} doing today?
            </p>
            <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 6, fontStyle: "italic" }}>
              {caregiverMsg}
            </p>
          </div>
        </Link>

        {/* Quick actions 2x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { href: "/log", icon: Activity, label: "Log Symptoms", bg: "#F0F5F2", color: "#2C5F4A" },
            { href: "/chat", icon: MessageCircle, label: "Ask Medalyn", bg: "#F0F5F2", color: "#2C5F4A" },
            { href: "/chat", icon: UploadCloud, label: "Upload Doc", bg: "#FDF3EE", color: "#C4714A" },
            { href: "/tools/trials", icon: Search, label: "Find Trials", bg: "#FDF3EE", color: "#C4714A" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                textDecoration: "none",
                color: "#1A1A1A",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: a.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <a.icon size={20} color={a.color} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Family update button */}
        <button
          onClick={handleFamilyUpdate}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 24,
            backgroundColor: "#2C5F4A",
            color: "#FFFFFF",
            border: "none",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Send family update →
        </button>

        {/* Upcoming appointments */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Upcoming
          </h2>
          {appointments.length === 0 ? (
            <button
              onClick={() => setShowApptModal(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                color: "#2C5F4A",
                fontWeight: 500,
                padding: "8px 0",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              + Add appointment
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: "14px 16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{appt.title || "Appointment"}</p>
                  <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 12, color: "#6B6B6B" }}>
                    {appt.datetime && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={12} />
                        {new Date(appt.datetime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                    {appt.location && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} />
                        {appt.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowApptModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#2C5F4A",
                  fontWeight: 500,
                  padding: "4px 0",
                  fontFamily: "var(--font-dm-sans)",
                  textAlign: "left",
                }}
              >
                + Add another
              </button>
            </div>
          )}
        </div>

        {/* Recent symptoms */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recent symptoms
          </h2>
          {!loggedToday && logs.length === 0 ? (
            <Link
              href="/log"
              style={{ fontSize: 14, color: "#2C5F4A", fontWeight: 500, padding: "8px 0", display: "block", textDecoration: "none" }}
            >
              Nothing logged yet. How is {patient.name} feeling?
            </Link>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {logs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: "14px 16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#6B6B6B" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}
                    </span>
                    {log.overall_severity !== null && (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: log.overall_severity > 6 ? "#ef4444" : log.overall_severity > 3 ? "#f59e0b" : "#22c55e",
                      }}>
                        {log.overall_severity}/10
                      </span>
                    )}
                  </div>
                  {log.ai_summary && (
                    <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4, lineHeight: 1.4 }}>
                      {log.ai_summary.length > 100 ? log.ai_summary.slice(0, 100) + "..." : log.ai_summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointment modal */}
      {showApptModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowApptModal(false)} />
          <div style={{ position: "relative", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20 }}>Add appointment</h3>
              <button onClick={() => setShowApptModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#6B6B6B" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Title (e.g., Oncology follow-up)" value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} style={inputStyle} />
              <input placeholder="Doctor name" value={apptDoctor} onChange={(e) => setApptDoctor(e.target.value)} style={inputStyle} />
              <input placeholder="Location" value={apptLocation} onChange={(e) => setApptLocation(e.target.value)} style={inputStyle} />
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>
              <input placeholder="Notes (optional)" value={apptNotes} onChange={(e) => setApptNotes(e.target.value)} style={inputStyle} />
              <button
                onClick={handleSaveAppt}
                disabled={apptSaving || !apptTitle.trim() || !apptDate}
                style={{
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#2C5F4A",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: apptSaving || !apptTitle.trim() || !apptDate ? 0.5 : 1,
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {apptSaving ? "Saving..." : "Save appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family update modal */}
      {showUpdateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => { if (!updateLoading) setShowUpdateModal(false); }} />
          <div style={{
            position: "relative", backgroundColor: "#FFFFFF", borderRadius: 16, width: "100%", maxWidth: 480,
            maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}>
            {/* Sticky header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px 12px", flexShrink: 0 }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20 }}>Family update</h3>
              <button onClick={() => setShowUpdateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color="#6B6B6B" />
              </button>
            </div>
            {updateLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 28px", justifyContent: "center" }}>
                <Loader2 size={20} className="animate-spin" color="#2C5F4A" />
                <span style={{ fontSize: 14, color: "#6B6B6B" }}>Writing update...</span>
              </div>
            ) : (
              <>
                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}>
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    style={{
                      width: "100%", minHeight: 180, border: "1.5px solid #E8E2D9", borderRadius: 12,
                      padding: 16, fontSize: 15, color: "#1A1A1A", lineHeight: 1.7, resize: "vertical",
                      fontFamily: "var(--font-dm-sans)", outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
                    onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
                  />
                </div>
                {/* Sticky footer */}
                <div style={{ padding: "16px 28px 24px", flexShrink: 0 }}>
                  <button
                    onClick={handleCopy}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: copied ? "#22c55e" : "#2C5F4A",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "var(--font-dm-sans)",
                      transition: "background-color 0.2s",
                    }}
                  >
                  {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy to clipboard</>}
                </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
