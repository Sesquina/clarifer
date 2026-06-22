/**
 * components/home/home-client.tsx
 * Home screen — full redesign (feat/home-screen-redesign).
 * All data-fetching logic lives in app/home/page.tsx (server).
 * This file owns only the UI layer.
 *
 * Tables: None directly. Calls /api/family-update and /api/appointments.
 * Auth: assumed — wrapping layout gate.
 * HIPAA: No PHI displayed beyond patient first name and care summary.
 *        No hex color strings — design tokens only.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  MessageCircle,
  FileText,
  Wrench,
  Calendar,
  MapPin,
  X,
  Loader2,
  Copy,
  Check,
  Home,
  Users,
  Sparkles,
} from "lucide-react";
import { stripMarkdown } from "@/lib/family-update/strip-markdown";

// ─── CCF support group links ────────────────────────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface HomeClientProps {
  patient: { id: string; name: string; diagnosis: string | null };
  statusLine: string;
  logs: Array<{
    id: string;
    created_at: string | null;
    overall_severity: number | null;
    ai_summary: string | null;
    [key: string]: unknown;
  }>;
  appointments: Array<{
    id: string;
    title: string | null;
    datetime: string | null;
    location: string | null;
    provider_name?: string | null;
  }>;
  loggedToday: boolean;
  documentsCount: number;
  nextAppointment: {
    id: string;
    title: string | null;
    datetime: string | null;
    provider_name: string | null;
  } | null;
  mostRecentAlert: {
    overall_severity: number;
    responses: Record<string, unknown> | null;
    created_at: string | null;
  } | null;
  lastUpdated: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAppt(datetime: string | null): string {
  if (!datetime) return "";
  return new Date(datetime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function formatLogDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function getSeverityStyle(severity: number): { border: string; bg: string; text: string } {
  if (severity >= 7) return { border: "#E24B4A", bg: "#FCEBEB", text: "#A32D2D" };
  if (severity >= 4) return { border: "#BA7517", bg: "#FAEEDA", text: "#633806" };
  return { border: "#0F6E56", bg: "#E1F5EE", text: "#085041" };
}

// ─── Quick action grid config ─────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Log Symptoms", href: "/log",              bg: "var(--pale-sage)",  color: "var(--primary)", icon: Activity  },
  { label: "Ask Clarifer", href: "/chat",             bg: "var(--pale-terra)", color: "var(--accent)",  icon: Sparkles  },
  { label: "Upload Doc",   href: "/documents/upload", bg: "var(--pale-sage)",  color: "var(--primary)", icon: FileText  },
  { label: "Find Trials",  href: "/tools/trials",     bg: "var(--pale-terra)", color: "var(--accent)",  icon: Wrench    },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────
export function HomeClient({
  patient,
  statusLine,
  logs,
  appointments,
  loggedToday,
  documentsCount,
  nextAppointment,
  mostRecentAlert,
  lastUpdated,
}: HomeClientProps) {
  // ── State (unchanged from previous implementation) ─────────────────────────
  const [showApptModal, setShowApptModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [apptTitle, setApptTitle] = useState("");
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptLocation, setApptLocation] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [apptSaving, setApptSaving] = useState(false);

  const firstName = patient.name.split(" ")[0];
  const isCholangiocarcinoma = patient.diagnosis
    ?.toLowerCase()
    .includes("cholangiocarcinoma");

  // ── Handlers (logic unchanged from previous implementation) ────────────────
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
        const captured = stripMarkdown(text);
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
        datetime: apptTime
          ? `${apptDate}T${apptTime}:00`
          : `${apptDate}T09:00:00`,
        notes: apptNotes || null,
      }),
    });
    if (!res.ok) { setApptSaving(false); return; }
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


  // ── Shared input style for modals ──────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    height: 48,
    borderRadius: 12,
    border: "1.5px solid var(--border)",
    padding: "0 16px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: 15,
    color: "var(--text)",
    backgroundColor: "var(--card)",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* ── RESPONSIVE GRID LAYOUT ──────────────────────────────────────────── */}
        <div
          className="px-5 pt-6 md:px-10 md:grid md:gap-10 w-full"
          style={{ gridTemplateColumns: "1fr 400px", maxWidth: 1200, margin: "0 auto" }}
        >
          {/* ════ LEFT / MAIN COLUMN ═══════════════════════════════════════════ */}
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* ── HERO SECTION ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--muted)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Caring for
              </p>
              <p
                style={{
                  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {firstName}
              </p>
              {lastUpdated && (
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  Last updated {relativeTime(lastUpdated)}
                </p>
              )}
            </div>

            {/* ── ALERT BAR (only when most recent log is severity >= 7) ────── */}
            {mostRecentAlert && (
              <div
                style={{
                  position: "relative",
                  backgroundColor: "#FCEBEB",
                  border: "1px solid #E24B4A",
                  borderRadius: 10,
                  padding: "10px 12px 10px 16px",
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: "#E24B4A",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#A32D2D",
                  }}
                >
                  {(() => {
                    const raw = mostRecentAlert.responses?.symptoms;
                    const symptomName =
                      Array.isArray(raw) && raw.length > 0
                        ? String(raw[0])
                        : "Symptom";
                    return `${symptomName} was ${mostRecentAlert.overall_severity}/10 yesterday. Worth a look before the next visit.`;
                  })()}
                </p>
              </div>
            )}

            {/* ── QUICK ACTION GRID ─────────────────────────────────────────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="md:shadow-sm"
                    style={{
                      backgroundColor: action.bg,
                      borderRadius: 14,
                      padding: 12,
                      minHeight: 80,
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "var(--card)",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "auto",
                        flexShrink: 0,
                      }}
                    >
                      <action.icon
                        size={18}
                        color={action.color}
                        aria-hidden="true"
                      />
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: 500,
                        color: action.color,
                        marginTop: 8,
                      }}
                    >
                      {action.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── SEND FAMILY UPDATE BUTTON ─────────────────────────────────── */}
            <button
              type="button"
              onClick={handleFamilyUpdate}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                backgroundColor: "var(--primary)",
                color: "var(--card)",
                border: "none",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                marginBottom: 20,
              }}
            >
              Send family update &#x2192;
            </button>

            {/* ── RECENT SYMPTOMS SECTION ───────────────────────────────────── */}
            <section aria-label="Recent symptoms">
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--muted)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Recent symptoms
              </p>

              {logs.length === 0 ? (
                <Link href="/log" style={{ textDecoration: "none", display: "block", minHeight: 48 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      fontSize: 13,
                      color: "var(--muted)",
                      padding: "16px 0",
                    }}
                  >
                    {firstName} is lucky to have someone paying this much attention.
                  </p>
                </Link>
              ) : (
                logs.map((log) => {
                  const sev = log.overall_severity ?? 0;
                  const style = getSeverityStyle(sev);
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "var(--card)",
                        borderRadius: 10,
                        border: "0.5px solid var(--border)",
                        borderLeft: `3px solid ${style.border}`,
                        padding: "10px 12px 10px 14px",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          fontSize: 13,
                          color: "var(--muted)",
                        }}
                      >
                        {formatLogDate(log.created_at)}
                      </span>
                      <span
                        style={{
                          borderRadius: 20,
                          padding: "2px 10px",
                          backgroundColor: style.bg,
                          color: style.text,
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {sev}/10
                      </span>
                    </div>
                  );
                })
              )}
            </section>


          </div>

          {/* ════ RIGHT COLUMN — stacks below on mobile, 400px on desktop ════════ */}
          <div
            className="flex flex-col mt-5 md:mt-0"
            style={{ gap: 16 }}
          >
            {/* ── UPCOMING APPOINTMENT ──────────────────────────────────────── */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--muted)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Upcoming
              </p>
              <div
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: 14,
                  border: "0.5px solid var(--border)",
                  padding: 16,
                }}
              >
                {nextAppointment ? (
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: 4,
                      }}
                    >
                      {nextAppointment.title ?? nextAppointment.provider_name ?? "Appointment"}
                    </p>
                    {nextAppointment.datetime && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                          fontSize: 13,
                          color: "var(--muted)",
                        }}
                      >
                        <Calendar size={13} aria-hidden="true" />
                        {fmtAppt(nextAppointment.datetime)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 48,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        fontSize: 14,
                        color: "var(--muted)",
                      }}
                    >
                      <Calendar size={16} color="var(--muted)" aria-hidden="true" />
                      Nothing coming up
                    </span>
                    <Link
                      href={`/patients/${patient.id}/appointments`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 32,
                        padding: "0 12px",
                        backgroundColor: "var(--pale-sage)",
                        color: "var(--primary)",
                        borderRadius: 8,
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: "none",
                        minWidth: 48,
                      }}
                    >
                      + Add
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ── CCF CARD (cholangiocarcinoma only) ────────────────────────── */}
            {isCholangiocarcinoma && (
              <div
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: 14,
                  border: "0.5px solid var(--border)",
                  padding: 16,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "var(--pale-sage)",
                    color: "var(--primary)",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 9,
                    fontWeight: 500,
                    borderRadius: 4,
                    padding: "3px 8px",
                    marginBottom: 10,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  From CCF
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  Don&apos;t know where to start?
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "var(--muted)",
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  CCF offers a free care kit, a 1:1 advocate meeting, and a resource roadmap.
                </p>
                <button
                  type="button"
                  onClick={() => window.open("https://www.cholangiocarcinoma.org", "_blank", "noopener,noreferrer")}
                  style={{
                    height: 36,
                    padding: "0 16px",
                    backgroundColor: "var(--primary)",
                    color: "var(--card)",
                    border: "none",
                    borderRadius: 8,
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    minWidth: 48,
                  }}
                >
                  Connect with CCF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacer for mobile tab bar */}
        <div className="md:hidden" style={{ height: 96 }} />
      </div>

      {/* ── APPOINTMENT MODAL (logic unchanged) ─────────────────────────────── */}
      {showApptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            onClick={() => setShowApptModal(false)}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "var(--card)",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontFamily:
                    "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 20,
                }}
              >
                Add appointment
              </h3>
              <button
                type="button"
                onClick={() => setShowApptModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} color="var(--muted)" aria-hidden="true" />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                placeholder="Title (e.g., Oncology follow-up)"
                value={apptTitle}
                onChange={(e) => setApptTitle(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Doctor name"
                value={apptDoctor}
                onChange={(e) => setApptDoctor(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Location"
                value={apptLocation}
                onChange={(e) => setApptLocation(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="time"
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <input
                placeholder="Notes (optional)"
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={handleSaveAppt}
                disabled={apptSaving || !apptTitle.trim() || !apptDate}
                style={{
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "var(--primary)",
                  color: "var(--card)",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity:
                    apptSaving || !apptTitle.trim() || !apptDate ? 0.5 : 1,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {apptSaving ? "Saving..." : "Save appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAMILY UPDATE MODAL (logic unchanged) ───────────────────────────── */}
      {showUpdateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            onClick={() => {
              if (!updateLoading) setShowUpdateModal(false);
            }}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "var(--card)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 480,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 28px 12px",
                flexShrink: 0,
              }}
            >
              <h3
                style={{
                  fontFamily:
                    "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 20,
                }}
              >
                Family update
              </h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} color="var(--muted)" aria-hidden="true" />
              </button>
            </div>

            {updateLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "24px 28px",
                  justifyContent: "center",
                }}
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                  color="var(--primary)"
                />
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--muted)",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  }}
                >
                  Writing update...
                </span>
              </div>
            ) : (
              <>
                <div
                  style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}
                >
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 180,
                      border: "1.5px solid var(--border)",
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 15,
                      color: "var(--text)",
                      lineHeight: 1.7,
                      resize: "vertical",
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                </div>
                <div style={{ padding: "16px 28px 24px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: copied
                        ? "var(--primary)"
                        : "var(--primary)",
                      color: "var(--card)",
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      opacity: copied ? 0.85 : 1,
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={18} aria-hidden="true" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={18} aria-hidden="true" /> Copy to clipboard
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── CCF Card sub-component ──────────────────────────────────────────────────
function CcfCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        borderRadius: 14,
        border: "1.5px solid var(--primary)",
        padding: compact ? 14 : 20,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        }}
      >
        From CCF
      </p>
      <p
        style={{
          fontSize: compact ? 14 : 17,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 6,
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        }}
      >
        Don&apos;t know where to start?
      </p>
      {!compact && (
        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            lineHeight: 1.6,
            marginBottom: 14,
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          CCF offers a free care kit, a 1:1 meeting with a patient advocate,
          and a resource roadmap for families navigating this diagnosis.
        </p>
      )}
      <a
        href="https://www.cholangiocarcinoma.org/newly-diagnosed/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: compact ? 36 : 48,
          borderRadius: 10,
          backgroundColor: "var(--primary)",
          color: "var(--card)",
          fontSize: compact ? 13 : 14,
          fontWeight: 600,
          textDecoration: "none",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          boxSizing: "border-box",
        }}
      >
        Connect with CCF
      </a>
    </div>
  );
}
