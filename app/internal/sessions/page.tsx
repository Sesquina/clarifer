// app/internal/sessions/page.tsx
// Sessions roadmap tracker -- Clarifer Command Center
// Tracks all 126 planned sessions (C01-C31 completed, remainder in tiers).
// State persisted in localStorage; completed sessions are read-only.
// Rule: no hex strings in JSX -- use CSS variables only.

"use client";

import { useEffect, useState } from "react";

const LS_KEY = "clarifer_sessions";

const COMPLETED_SESSIONS: { id: string; title: string }[] = [
  { id: "C01", title: "Proxy import fix" },
  { id: "C02", title: "Upload Doc href fixed" },
  { id: "C03", title: "Appointment insert moved to API route" },
  { id: "C04", title: "Delete-account audit log added" },
  { id: "C05", title: "Upload route audit log added" },
  { id: "C06", title: "Waitlist page at clarifer.com/waitlist" },
  { id: "C07", title: "GA event tracking on waitlist form submit" },
  { id: "C08", title: "Brevo waitlist iframe embed" },
  { id: "C09", title: "CSP fix signup was broken" },
  { id: "C10", title: "Waitlist button in header links correctly" },
  { id: "C11", title: "Waitlist added to public routes in middleware" },
  { id: "C12", title: "Copy violations removed serious illness x4" },
  { id: "C13", title: "First action nudge after onboarding" },
  { id: "C14", title: "Hex strings replaced with CSS variables in home-client" },
  { id: "C15", title: "Session timeout message on login page" },
  { id: "C16", title: "Storage deletion path bug fixed" },
  { id: "C17", title: "Missing tables added to account deletion cascade" },
  { id: "C18", title: "Medical disclaimer modal with timestamp" },
  { id: "C19", title: "Supabase migration run disclaimer_accepted_at" },
  { id: "C20", title: "useSearchParams Suspense fix build was broken" },
  { id: "C21", title: "Serious illness removed from login page" },
  { id: "C22", title: "Mobile API URL configured EXPO_PUBLIC_API_URL" },
  { id: "C23", title: "Instant upload redirect removed blocking analysis wait" },
  { id: "C24", title: "Onboarding welcome screen added" },
  { id: "C25", title: "Onboarding copy rewrite for caregivers" },
  { id: "C26", title: "Caregiver promise page at clarifer.com/promise" },
  { id: "C27", title: "CCF stale dates removed" },
  { id: "C28", title: "Condition name hidden from home screen" },
  { id: "C29", title: "First-time welcome state on home screen" },
  { id: "C30", title: "Location and language fields in onboarding" },
  { id: "C31", title: "Welcome email via Brevo on signup" },
];

const TIERS: { id: string; label: string; sessions: { id: string; title: string }[] }[] = [
  {
    id: "T1",
    label: "Tier 1 -- Core Document Intelligence",
    sessions: [
      { id: "S01", title: "Document summary on upload" },
      { id: "S02", title: "Document detail page with summary" },
      { id: "S03", title: "Document list page with status" },
      { id: "S04", title: "Document delete with storage cleanup" },
      { id: "S05", title: "Multi-page PDF support" },
      { id: "S06", title: "Image OCR for uploaded photos" },
      { id: "S07", title: "Document re-analysis trigger" },
      { id: "S08", title: "Document search by keyword" },
      { id: "S09", title: "Document tag system" },
      { id: "S10", title: "Document share link (read-only)" },
    ],
  },
  {
    id: "T2",
    label: "Tier 2 -- Appointments and Timeline",
    sessions: [
      { id: "S11", title: "Appointment list with upcoming sort" },
      { id: "S12", title: "Appointment detail page" },
      { id: "S13", title: "Appointment edit and delete" },
      { id: "S14", title: "Appointment reminder email via Brevo" },
      { id: "S15", title: "Calendar view of appointments" },
      { id: "S16", title: "Care timeline combining docs and appointments" },
      { id: "S17", title: "Appointment notes field" },
      { id: "S18", title: "Recurring appointment support" },
      { id: "S19", title: "Past vs upcoming appointment tabs" },
      { id: "S20", title: "Export appointments to iCal" },
    ],
  },
  {
    id: "T3",
    label: "Tier 3 -- Symptom Tracker",
    sessions: [
      { id: "S21", title: "Symptom log entry (name, severity, date)" },
      { id: "S22", title: "Symptom list with history" },
      { id: "S23", title: "Symptom delete and edit" },
      { id: "S24", title: "Symptom trend chart (7-day)" },
      { id: "S25", title: "Symptom-to-appointment correlation" },
      { id: "S26", title: "Symptom severity heatmap" },
      { id: "S27", title: "Symptom export to PDF for doctor" },
      { id: "S28", title: "Symptom reminder (daily check-in)" },
      { id: "S29", title: "AI insight from symptom patterns" },
      { id: "S30", title: "Symptom sharing with care team" },
    ],
  },
  {
    id: "T4",
    label: "Tier 4 -- Care Team",
    sessions: [
      { id: "S31", title: "Care team member add (name, role, contact)" },
      { id: "S32", title: "Care team list page" },
      { id: "S33", title: "Care team member edit and delete" },
      { id: "S34", title: "Provider message drafting with AI" },
      { id: "S35", title: "Care team invite via email" },
      { id: "S36", title: "Shared read-only view for invitee" },
      { id: "S37", title: "Care team role permissions (viewer vs editor)" },
      { id: "S38", title: "Care team activity feed" },
      { id: "S39", title: "Secure message thread with care team" },
      { id: "S40", title: "Care team export contact sheet" },
    ],
  },
  {
    id: "T5",
    label: "Tier 5 -- Mobile App",
    sessions: [
      { id: "S41", title: "Mobile auth flow (Supabase OTP)" },
      { id: "S42", title: "Mobile home screen" },
      { id: "S43", title: "Mobile document upload" },
      { id: "S44", title: "Mobile document list" },
      { id: "S45", title: "Mobile appointment list" },
      { id: "S46", title: "Mobile symptom log" },
      { id: "S47", title: "Mobile push notifications (Expo)" },
      { id: "S48", title: "Mobile offline support" },
      { id: "S49", title: "Mobile onboarding flow" },
      { id: "S50", title: "App Store submission prep" },
    ],
  },
  {
    id: "T6",
    label: "Tier 6 -- Growth and Waitlist",
    sessions: [
      { id: "S51", title: "Waitlist referral tracking" },
      { id: "S52", title: "Waitlist position display" },
      { id: "S53", title: "Waitlist admin approval flow" },
      { id: "S54", title: "Referral reward system" },
      { id: "S55", title: "Waitlist analytics dashboard" },
      { id: "S56", title: "Growth email sequence (Brevo)" },
      { id: "S57", title: "Landing page A/B test" },
      { id: "S58", title: "SEO meta tags and sitemap" },
      { id: "S59", title: "Social proof section on landing page" },
      { id: "S60", title: "Press kit page" },
    ],
  },
  {
    id: "T7",
    label: "Tier 7 -- Compliance and Security",
    sessions: [
      { id: "S61", title: "HIPAA audit log review and hardening" },
      { id: "S62", title: "RLS policy audit across all tables" },
      { id: "S63", title: "Data export for GDPR right-to-access" },
      { id: "S64", title: "Data deletion for GDPR right-to-erasure" },
      { id: "S65", title: "BAA with Supabase documented" },
      { id: "S66", title: "Penetration test scope and checklist" },
      { id: "S67", title: "Two-factor authentication (TOTP)" },
      { id: "S68", title: "Session revocation on password change" },
      { id: "S69", title: "API rate limiting" },
      { id: "S70", title: "SOC 2 readiness checklist" },
    ],
  },
  {
    id: "T8",
    label: "Tier 8 -- Platform and Infrastructure",
    sessions: [
      { id: "S71", title: "End-to-end test suite (Playwright)" },
      { id: "S72", title: "CI pipeline on Vercel (lint + tsc + test)" },
      { id: "S73", title: "Error monitoring (Sentry)" },
      { id: "S74", title: "Uptime monitoring (Better Uptime)" },
      { id: "S75", title: "Staging environment on Vercel" },
      { id: "S76", title: "Database backups verified and documented" },
      { id: "S77", title: "Feature flags system" },
      { id: "S78", title: "Analytics events schema documented" },
      { id: "S79", title: "API versioning strategy" },
      { id: "S80", title: "On-call runbook" },
      { id: "S81", title: "Load test for upload and analysis pipeline" },
      { id: "S82", title: "Cost dashboard (Vercel + Supabase + Anthropic)" },
      { id: "S83", title: "Dependency audit and update schedule" },
      { id: "S84", title: "Documentation site (Mintlify or Docusaurus)" },
      { id: "S85", title: "Internal API SDK for mobile" },
    ],
  },
];

const TOTAL = 126;

export default function SessionsPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [completedOpen, setCompletedOpen] = useState(false);
  const [openTiers, setOpenTiers] = useState<Set<string>>(
    () => new Set(TIERS.map((t) => t.id))
  );

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        setChecked(new Set(ids));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever checked changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...checked]));
    } catch {
      // ignore storage errors
    }
  }, [checked]);

  function toggleSession(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleTier(tierId: string) {
    setOpenTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) {
        next.delete(tierId);
      } else {
        next.add(tierId);
      }
      return next;
    });
  }

  const doneCount = COMPLETED_SESSIONS.length + checked.size;
  const progress = Math.round((doneCount / TOTAL) * 100);

  return (
    <div style={{ maxWidth: 760, paddingBottom: 64 }}>
      {/* Header */}
      <h1
        style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 28,
          fontWeight: 700,
          color: "var(--primary)",
          marginBottom: 4,
        }}
      >
        Sessions
      </h1>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        {doneCount} of {TOTAL} sessions complete
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "var(--border)",
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 4,
            backgroundColor: "var(--primary)",
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* Completed sessions (collapsed by default) */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setCompletedOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 0",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--muted)",
            }}
          >
            Completed ({COMPLETED_SESSIONS.length})
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {completedOpen ? "▲" : "▼"}
          </span>
        </button>

        {completedOpen && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            {COMPLETED_SESSIONS.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 44,
                  padding: "0 16px",
                  backgroundColor: i % 2 === 0 ? "var(--surface)" : "transparent",
                  borderBottom:
                    i < COMPLETED_SESSIONS.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <input
                  type="checkbox"
                  checked
                  disabled
                  readOnly
                  style={{ accentColor: "var(--primary)", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "var(--muted)",
                    minWidth: 48,
                    flexShrink: 0,
                  }}
                >
                  {s.id}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--muted)",
                    textDecoration: "line-through",
                  }}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier sections */}
      {TIERS.map((tier) => {
        const isOpen = openTiers.has(tier.id);
        const tierDone = tier.sessions.filter((s) => checked.has(s.id)).length;
        return (
          <div key={tier.id} style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => toggleTier(tier.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "var(--primary)",
                  flex: 1,
                }}
              >
                {tier.label}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
                {tierDone}/{tier.sessions.length}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                {tier.sessions.map((s, i) => {
                  const done = checked.has(s.id);
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 44,
                        padding: "0 16px",
                        backgroundColor:
                          i % 2 === 0 ? "var(--surface)" : "transparent",
                        borderBottom:
                          i < tier.sessions.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleSession(s.id)}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleSession(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ accentColor: "var(--primary)", flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "var(--muted)",
                          minWidth: 48,
                          flexShrink: 0,
                        }}
                      >
                        {s.id}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: done ? "var(--muted)" : "var(--foreground)",
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
