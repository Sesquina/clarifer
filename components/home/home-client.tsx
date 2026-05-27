"use client";

import { useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Activity, MessageCircle, UploadCloud, Search, Calendar, MapPin, Plus, X, Loader2, Copy, Check } from "lucide-react";

const CCF_GROUPS = [
  {
    title: "Caregiver Support Group",
    url: "https://dshutlxab.cc.rs6.net/tn.jsp?f=001nNt4QfQRuy00wvw0ZB4RwFxVBUi4xunslSX1QWhXE45K8eiveaHOjAiQIArwM41HYbM0RQPPXgSkB2UWWszsUQ9FG1r27nC4vwLUcgpuSSYSEZmdzF4JxuJblViMUmNlxo_JUVOe_HmvC-4XEXzYG4AELnnOd4jPOwHhKkf72Ow=",
  },
  {
    title: "Patient Support Group",
    url: "https://dshutlxab.cc.rs6.net/tn.jsp?f=001nNt4QfQRuy00wvw0ZB4RwFxVBUi4xunslSX1QWhXE45K8eiveaHOjGoOqTr68jfYyoO_j76NuicBdPn50IBpulbzvfjKw9OR5FbXRTUaoYHiz6XApwXOTG3QCJgKLicMUIZ9AmenH02uw5hPDRz9nfPv_ejDvtaIQM7S8KfNYCDlRbfUurEmQQ==",
  },
  {
    title: "Spanish Support Group",
    url: "https://dshutlxab.cc.rs6.net/tn.jsp?f=001nNt4QfQRuy00wvw0ZB4RwFxVBUi4xunslSX1QWhXE45K8eiveaHOjBvnHVdN1ZeRnjCCyuz1wuWtVWSnfGJx503Zh_0iNXS0kny0XIGlRFRJJ0VHrR8_q8z6aSOOZQiOs5QO_zRQjA1wsY6zx793dQMbXmbkpSNK",
  },
  {
    title: "Bereaved Support Group",
    url: "https://dshutlxab.cc.rs6.net/tn.jsp?f=001nNt4QfQRuy00wvw0ZB4RwFxVBUi4xunslSX1QWhXE45K8eiveaHOjF6SJlk8pFOa6_GzeFX5x1fChoEArzMOuWChFEpgjRpAPa5BPS95UoNQqxOkoI-IhGtHli58DVYEZ-jm6hpGUSaZp2dMfBXOH0IAnO8Rfaqv",
  },
  {
    title: "Young Adult Support Group",
    url: "https://dshutlxab.cc.rs6.net/tn.jsp?f=001nNt4QfQRuy00wvw0ZB4RwFxVBUi4xunslSX1QWhXE45K8eiveaHOjNkEQlBZJIdzLUC3Ujct-mgMvBlSRmbNgYvgnagrW1BEKZWOUj28QgaNrrORA9xnLf5hQLjIBdEdEl_geMeGbUksJcyhT1GTprgf3HJR2e8S",
  },
];


interface HomeClientProps {
  patient: { id: string; name: string; diagnosis: string | null };
  statusLine: string;
  logs: Array<{ id: string; created_at: string | null; overall_severity: number | null; ai_summary: string | null; [key: string]: unknown }>;
  appointments: Array<{ id: string; title: string | null; datetime: string | null; location: string | null; provider_name?: string | null }>;
  loggedToday: boolean;
  documentsCount: number;
}

export function HomeClient({ patient, statusLine, logs, appointments, loggedToday, documentsCount }: HomeClientProps) {
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

  const firstName = patient.name.split(" ")[0];
  const isFirstTime = logs.length === 0 && documentsCount === 0;

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
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: patient.id,
        title: apptTitle,
        provider_name: apptDoctor || null,
        location: apptLocation || null,
        datetime: apptTime ? `${apptDate}T${apptTime}:00` : `${apptDate}T09:00:00`,
        notes: apptNotes || null,
      }),
    });
    if (!res.ok) {
      setApptSaving(false);
      return;
    }
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
            Caring for {firstName}
          </p>
          <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>
            {statusLine}
          </p>
        </div>

        {/* First-time welcome nudge */}
        {isFirstTime && (
          <div
            style={{
              backgroundColor: "var(--pale-sage)",
              borderRadius: 12,
              padding: "20px 24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 6,
              }}
            >
              Welcome. You are set up.
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 14,
                color: "var(--muted)",
                marginBottom: 8,
              }}
            >
              Pick something to start with.
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                fontSize: 14,
                color: "var(--muted)",
              }}
            >
              <Link
                href="/documents/upload"
                style={{ color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}
              >
                Upload a document
              </Link>
              {" or "}
              <Link
                href="/chat"
                style={{ color: "var(--primary)", fontWeight: 500, textDecoration: "none" }}
              >
                Ask a question
              </Link>
            </p>
          </div>
        )}

        {/* Quick actions 2x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { href: "/log", icon: Activity, label: "Log Symptoms", bg: "var(--pale-sage)", color: "var(--primary)" },
            { href: "/chat", icon: MessageCircle, label: "Ask Clarifer", bg: "var(--pale-sage)", color: "var(--primary)" },
            { href: "/documents/upload", icon: UploadCloud, label: "Upload Doc", bg: "var(--pale-terra)", color: "var(--accent)" },
            { href: "/tools/trials", icon: Search, label: "Find Trials", bg: "var(--pale-terra)", color: "var(--accent)" },
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
              Nothing logged yet. How is {firstName} feeling?
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

        {/* CCF sections -- only shown for cholangiocarcinoma patients */}
        {patient.diagnosis?.toLowerCase().includes("cholangiocarcinoma") && (
          <>
            {/* Newly Connected program card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                border: "1.5px solid #2C5F4A",
                padding: "20px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                FROM CCF
              </p>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>
                Are you newly diagnosed?
              </p>
              <p style={{ fontSize: 16, color: "#6B6B6B", lineHeight: 1.6, marginBottom: 16 }}>
                CCF offers a free care kit, a 1:1 meeting with a patient advocate, and a resource roadmap for families navigating this diagnosis.
              </p>
              <a
                href="https://www.cholangiocarcinoma.org/newly-diagnosed/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 52,
                  borderRadius: 10,
                  backgroundColor: "#2C5F4A",
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "var(--font-dm-sans)",
                  boxSizing: "border-box",
                }}
              >
                Connect with CCF
              </a>
            </div>

            {/* CCF Community support groups */}
            <div>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                CCF COMMUNITY
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CCF_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 14,
                      border: "0.5px solid #E8E2D9",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 500, color: "#1A1A1A" }}>
                        {group.title}
                      </p>
                      <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 2 }}>
                        Weekly: register to see upcoming dates
                      </p>
                      <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 2 }}>
                        Hosted by CCF
                      </p>
                    </div>
                    <a
                      href={group.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 44,
                        paddingLeft: 16,
                        paddingRight: 16,
                        borderRadius: 10,
                        border: "1.5px solid #2C5F4A",
                        color: "#2C5F4A",
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: "none",
                        fontFamily: "var(--font-dm-sans)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      Register
                    </a>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 12, lineHeight: 1.6 }}>
                Support groups are hosted by CCF. Clarifer is not affiliated with CCF.
              </p>
            </div>
          </>
        )}
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
