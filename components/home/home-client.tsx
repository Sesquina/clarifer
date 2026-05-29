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
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

// ─── Desktop left-rail nav items ─────────────────────────────────────────────
const RAIL_NAV = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/log", icon: Activity, label: "Log" },
  { href: "/documents", icon: FileText, label: "Docs" },
  { href: "/tools", icon: Wrench, label: "Tools" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function HomeClient({
  patient,
  statusLine,
  logs,
  appointments,
  loggedToday,
  documentsCount,
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

  // Sign out for desktop rail
  const supabase = createClient();
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // ── Priority card: most actionable item from existing data ─────────────────
  const priorityItem: {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    href?: string;
  } = (() => {
    if (appointments.length > 0) {
      const a = appointments[0];
      return {
        icon: Calendar,
        title: a.title ?? "Appointment",
        subtitle: fmtAppt(a.datetime),
        href: `/appointments`,
      };
    }
    if (logs.length > 0) {
      const l = logs[0];
      return {
        icon: Activity,
        title: l.overall_severity !== null
          ? `Severity ${l.overall_severity}/10`
          : "Recent symptom log",
        subtitle: l.created_at ? fmtDate(l.created_at) : "Recent entry",
        href: "/log",
      };
    }
    return {
      icon: FileText,
      title: "Upload your first document",
      subtitle: "Labs, imaging, or clinical notes",
      href: "/documents/upload",
    };
  })();

  // ── Four care-timeline items from existing fetched data ────────────────────
  const timelineItems: Array<{
    icon: React.ElementType;
    title: string;
    subtitle: string;
    href: string;
  }> = [
    {
      icon: Activity,
      title: loggedToday
        ? "Symptoms logged today"
        : logs.length > 0
          ? `Last logged ${fmtDate(logs[0].created_at)}`
          : "Log today's symptoms",
      subtitle: loggedToday
        ? "All up to date"
        : logs.length === 0
          ? "Nothing logged yet"
          : "Tap to add an entry",
      href: "/log",
    },
    {
      icon: Calendar,
      title:
        appointments.length > 0
          ? appointments[0].title ?? "Upcoming appointment"
          : "No upcoming appointments",
      subtitle:
        appointments.length > 0
          ? fmtAppt(appointments[0].datetime)
          : "Add an appointment",
      href: "/appointments",
    },
    {
      icon: FileText,
      title:
        documentsCount > 0
          ? `${documentsCount} document${documentsCount > 1 ? "s" : ""} uploaded`
          : "Upload a document",
      subtitle:
        documentsCount > 0
          ? "View your documents"
          : "Labs, imaging, clinical notes",
      href: documentsCount > 0 ? "/documents" : "/documents/upload",
    },
    {
      icon: Users,
      title: "Send a family update",
      subtitle: "Keep your circle informed",
      href: "#family-update",
    },
  ];

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
      {/* ── DESKTOP: Fixed left nav rail (hidden on mobile) ──────────────────── */}
      <nav
        aria-label="Main navigation"
        className="hidden md:flex"
        style={{
          position: "fixed",
          top: 56,
          left: 0,
          bottom: 0,
          width: 52,
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--border)",
          zIndex: 30,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        {RAIL_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              color: "var(--muted)",
              textDecoration: "none",
              marginBottom: 4,
            }}
          >
            <item.icon size={20} aria-hidden="true" />
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            color: "var(--muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </nav>

      {/* ── MAIN CONTENT (offset by left rail on desktop) ─────────────────────── */}
      <div
        className="md:ml-[52px]"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* ── DESKTOP: Breadcrumb sub-header ──────────────────────────────────── */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 24px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--background)",
            position: "sticky",
            top: 56,
            zIndex: 20,
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "var(--muted)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            Caring for{" "}
            <span style={{ color: "var(--text)", fontWeight: 600 }}>
              · {firstName}
            </span>
          </span>
          <Link
            href="/chat"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              backgroundColor: "var(--pale-sage)",
              color: "var(--primary)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            <Sparkles size={14} aria-hidden="true" />
            Ask Clarifer
          </Link>
        </div>

        {/* ── TWO-COLUMN LAYOUT (single on mobile) ────────────────────────────── */}
        <div
          className="md:flex md:gap-6"
          style={{ padding: "24px 16px" }}
        >
          {/* ════ LEFT / MAIN COLUMN ═══════════════════════════════════════════ */}
          <div
            className="flex-1"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minWidth: 0,
            }}
          >
            {/* Patient hero */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                Caring for
              </p>
              <p
                style={{
                  fontFamily:
                    "var(--font-playfair), 'Playfair Display', serif",
                  fontSize: 38,
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1.1,
                  marginBottom: 8,
                }}
              >
                {firstName}
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--muted)",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {statusLine}
              </p>
            </div>

            {/* Section divider */}
            <div style={{ height: 1, backgroundColor: "var(--border)" }} />

            {/* Priority card */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: 16,
                padding: 18,
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  marginBottom: 12,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                Priority
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "var(--pale-sage)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <priorityItem.icon
                    size={18}
                    color="var(--primary)"
                    aria-hidden="true"
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text)",
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    }}
                  >
                    {priorityItem.title}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      marginTop: 2,
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    }}
                  >
                    {priorityItem.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Send family update — primary action button */}
            <button
              type="button"
              onClick={handleFamilyUpdate}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 14,
                backgroundColor: "var(--primary)",
                color: "var(--card)",
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              Send family update →
            </button>

            {/* CARE TIMELINE section */}
            <section aria-label="Care timeline">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 14,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                Care timeline
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {timelineItems.map((item, idx) => {
                  const isUpdate = item.href === "#family-update";
                  const inner = (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: "var(--pale-sage)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <item.icon
                          size={16}
                          color="var(--primary)"
                          aria-hidden="true"
                        />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text)",
                            fontFamily:
                              "var(--font-dm-sans), 'DM Sans', sans-serif",
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            marginTop: 1,
                            fontFamily:
                              "var(--font-dm-sans), 'DM Sans', sans-serif",
                          }}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  );

                  return isUpdate ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={handleFamilyUpdate}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link
                      key={idx}
                      href={item.href}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* CCF card — mobile only (desktop version in right column) */}
            {isCholangiocarcinoma && (
              <div className="md:hidden">
                <CcfCard />
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN — desktop only, 200px ════════════════════════════ */}
          <div
            className="hidden md:flex md:flex-col"
            style={{ width: 200, gap: 16, flexShrink: 0 }}
          >
            {/* Upcoming appointment card */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  marginBottom: 10,
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                Next appointment
              </p>
              {appointments.length > 0 ? (
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      fontFamily:
                        "var(--font-dm-sans), 'DM Sans', sans-serif",
                      marginBottom: 4,
                    }}
                  >
                    {appointments[0].title ?? "Appointment"}
                  </p>
                  {appointments[0].datetime && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "var(--muted)",
                      }}
                    >
                      <Calendar size={11} aria-hidden="true" />
                      {fmtAppt(appointments[0].datetime)}
                    </span>
                  )}
                  {appointments[0].location && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      <MapPin size={11} aria-hidden="true" />
                      {appointments[0].location}
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowApptModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--primary)",
                    fontWeight: 500,
                    padding: 0,
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  }}
                >
                  + Add appointment
                </button>
              )}
            </div>

            {/* CCF card (desktop right column, cholangiocarcinoma only) */}
            {isCholangiocarcinoma && <CcfCard compact />}

            {/* Care team quick link */}
            <Link
              href={`/patients/${patient.id}/care-team`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "var(--card)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: "12px 14px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  backgroundColor: "var(--pale-sage)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={14} color="var(--primary)" aria-hidden="true" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                Care team
              </span>
            </Link>
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
