/**
 * app/ccf-dashboard/ReachCommunity.tsx
 * Client component: "Send to your community" section with two bidirectional
 * demo flow modals for the CCF Foundation dashboard.
 * Tables: none -- all data is hardcoded demo data, no DB reads or writes.
 * Auth: parent page (page.tsx) enforces isAllowedEmail before rendering this.
 * Sprint: fix/ccf-dashboard-standalone-and-flows
 * HIPAA: No PHI. Hardcoded demo names only. No real emails sent.
 */

"use client";

import { useState } from "react";

// ─── Style constants ──────────────────────────────────────────────────────────

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

// ─── Demo data (hardcoded, no DB) ─────────────────────────────────────────────

const TRIALS = [
  "TOPAZ-1: Durvalumab + Gemcitabine/Cisplatin -- Phase 3, Recruiting",
  "Pemigatinib for FGFR2+ cholangiocarcinoma -- Phase 2, Recruiting",
  "Futibatinib for FGFR2 fusions -- Phase 2, Recruiting",
];

interface Caregiver {
  name: string;
  condition: string;
  daysAgo: number;
}

const MATCHED_CAREGIVERS: Caregiver[] = [
  { name: "Maria T.", condition: "CCA, intrahepatic", daysAgo: 12 },
  { name: "James R.", condition: "CCA, perihilar", daysAgo: 8 },
  { name: "Sofia M.", condition: "CCA, intrahepatic", daysAgo: 23 },
  { name: "David K.", condition: "CCA", daysAgo: 45 },
  { name: "Priya N.", condition: "CCA, intrahepatic", daysAgo: 3 },
  { name: "Ling W.", condition: "CCA", daysAgo: 67 },
];

interface Member {
  name: string;
  daysAgo: number;
}

const NEW_MEMBERS: Member[] = [
  { name: "Priya N.", daysAgo: 3 },
  { name: "James R.", daysAgo: 8 },
  { name: "Maria T.", daysAgo: 12 },
  { name: "Sofia M.", daysAgo: 23 },
];

interface Resource {
  id: string;
  title: string;
  sub: string;
}

const RESOURCES: Resource[] = [
  {
    id: "welcome-kit",
    title: "CCF Newly Connected Welcome Kit",
    sub: "Free care kit, resource roadmap, and patient advocate introduction",
  },
  {
    id: "support-groups",
    title: "CCF Support Groups -- May 2026",
    sub: "Upcoming virtual support groups for patients and caregivers",
  },
  {
    id: "biomarker-guide",
    title: "Understanding Biomarker Testing",
    sub: "CCF guide to FGFR2 and IDH1 testing and why it matters",
  },
];

// ─── Shared modal shell ───────────────────────────────────────────────────────

interface ModalShellProps {
  title: string;
  step: number;
  totalSteps: number;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

function ModalShell({ title, step, totalSteps, onClose, children, footer }: ModalShellProps) {
  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container */}
      <div
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                ...BODY,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--muted)",
                marginBottom: 4,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Step {step} of {totalSteps}
            </div>
            <h2
              id="modal-title"
              style={{
                ...HEADING,
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 8,
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {children}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

// ─── Shared success overlay ───────────────────────────────────────────────────

function SuccessScreen({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
          width: "100%",
          maxWidth: 480,
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 20,
        }}
      >
        {/* Checkmark circle */}
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "var(--pale-sage)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path
              d="M6 15l6 6 12-12"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h2
            id="success-title"
            style={{
              ...HEADING,
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text)",
              margin: "0 0 10px",
            }}
          >
            Sent successfully
          </h2>
          <p style={{ ...BODY, fontSize: 15, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            ...BODY,
            marginTop: 8,
            height: 48,
            padding: "0 32px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Modal 1: Trial alert ─────────────────────────────────────────────────────

interface Modal1State {
  step: 1 | 2 | 3 | 4;
  selectedTrial: string | null;
  selectedCaregivers: string[];
  success: boolean;
}

function TrialAlertModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<Modal1State>({
    step: 1,
    selectedTrial: null,
    selectedCaregivers: MATCHED_CAREGIVERS.map((c) => c.name),
    success: false,
  });

  const allChecked = state.selectedCaregivers.length === MATCHED_CAREGIVERS.length;

  function toggleCaregiver(name: string) {
    setState((s) => ({
      ...s,
      selectedCaregivers: s.selectedCaregivers.includes(name)
        ? s.selectedCaregivers.filter((n) => n !== name)
        : [...s.selectedCaregivers, name],
    }));
  }

  function setAllCaregivers(checked: boolean) {
    setState((s) => ({
      ...s,
      selectedCaregivers: checked ? MATCHED_CAREGIVERS.map((c) => c.name) : [],
    }));
  }

  function next() {
    setState((s) => ({ ...s, step: (s.step + 1) as Modal1State["step"] }));
  }

  function back() {
    setState((s) => ({ ...s, step: (s.step - 1) as Modal1State["step"] }));
  }

  // Extract short name for the preview message (part before " --")
  const trialShortName = state.selectedTrial?.split(" --")[0] ?? "[trial name]";
  const firstName = state.selectedCaregivers[0]?.split(" ")[0] ?? "Maria";

  if (state.success) {
    return (
      <SuccessScreen
        message={`Your alert has been sent to ${state.selectedCaregivers.length} ${
          state.selectedCaregivers.length === 1 ? "caregiver" : "caregivers"
        }.`}
        onClose={onClose}
      />
    );
  }

  // Step 1: Select trial
  if (state.step === 1) {
    return (
      <ModalShell
        title="Select a trial to alert caregivers about"
        step={1}
        totalSteps={4}
        onClose={onClose}
        footer={
          <button
            type="button"
            disabled={!state.selectedTrial}
            onClick={next}
            style={{
              ...BODY,
              height: 48,
              padding: "0 28px",
              borderRadius: "var(--radius-md)",
              backgroundColor: state.selectedTrial ? "var(--primary)" : "var(--border)",
              color: state.selectedTrial ? "var(--white)" : "var(--muted)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: state.selectedTrial ? "pointer" : "not-allowed",
            }}
          >
            Next
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TRIALS.map((trial) => {
            const selected = state.selectedTrial === trial;
            return (
              <button
                key={trial}
                type="button"
                onClick={() => setState((s) => ({ ...s, selectedTrial: trial }))}
                aria-pressed={selected}
                style={{
                  ...BODY,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: selected ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                  backgroundColor: selected ? "var(--pale-sage)" : "var(--card)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  minHeight: 52,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 2,
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: selected ? "5px solid var(--primary)" : "2px solid var(--border)",
                    backgroundColor: "var(--card)",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                    color: "var(--text)",
                    lineHeight: 1.5,
                  }}
                >
                  {trial}
                </span>
              </button>
            );
          })}
        </div>
      </ModalShell>
    );
  }

  // Step 2: Matched caregivers
  if (state.step === 2) {
    return (
      <ModalShell
        title="Caregivers matched to this trial"
        step={2}
        totalSteps={4}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={back}
              style={{
                ...BODY,
                height: 48,
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                border: "1.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              type="button"
              disabled={state.selectedCaregivers.length === 0}
              onClick={next}
              style={{
                ...BODY,
                height: 48,
                padding: "0 28px",
                borderRadius: "var(--radius-md)",
                backgroundColor:
                  state.selectedCaregivers.length > 0 ? "var(--primary)" : "var(--border)",
                color:
                  state.selectedCaregivers.length > 0 ? "var(--white)" : "var(--muted)",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: state.selectedCaregivers.length > 0 ? "pointer" : "not-allowed",
              }}
            >
              Next
            </button>
          </>
        }
      >
        <p style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
          These caregivers have opted into CCF communications and match the trial criteria.
        </p>

        {/* Select all / Deselect all */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {state.selectedCaregivers.length}{" "}
            {state.selectedCaregivers.length === 1 ? "caregiver" : "caregivers"} selected
          </span>
          <button
            type="button"
            onClick={() => setAllCaregivers(!allChecked)}
            style={{
              ...BODY,
              background: "transparent",
              border: "none",
              fontSize: 13,
              color: "var(--primary)",
              fontWeight: 500,
              cursor: "pointer",
              padding: "4px 0",
              minHeight: 44,
            }}
          >
            {allChecked ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* Caregiver list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {MATCHED_CAREGIVERS.map((c) => {
            const checked = state.selectedCaregivers.includes(c.name);
            return (
              <label
                key={c.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 10px",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  minHeight: 52,
                  backgroundColor: checked ? "var(--pale-sage)" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCaregiver(c.name)}
                  style={{ width: 18, height: 18, flexShrink: 0, accentColor: "var(--primary)", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {c.name}
                  </div>
                  <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {c.condition} &middot; joined {c.daysAgo} {c.daysAgo === 1 ? "day" : "days"} ago
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </ModalShell>
    );
  }

  // Step 3: Preview message
  if (state.step === 3) {
    return (
      <ModalShell
        title="Preview your message"
        step={3}
        totalSteps={4}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={back}
              style={{
                ...BODY,
                height: 48,
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                border: "1.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              style={{
                ...BODY,
                height: 48,
                padding: "0 28px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary)",
                color: "var(--white)",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </>
        }
      >
        <div
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "20px 20px",
          }}
        >
          <div
            style={{
              ...BODY,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            Subject
          </div>
          <div
            style={{
              ...BODY,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text)",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            New clinical trial that may be relevant for your loved one
          </div>
          <div
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--text)",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {`Hi ${firstName},\n\nThe Cholangiocarcinoma Foundation wanted to make sure you knew about a clinical trial that may be relevant for your family's situation.\n\n${trialShortName} is currently recruiting patients with cholangiocarcinoma.\n\nTo learn more and see if your loved one may qualify, visit clarifer.com/tools/trials and use the trial finder.\n\nYou are receiving this because you opted into communications from CCF through Clarifer. To unsubscribe, reply to this email.\n\nWith care,\nThe CCF Team`}
          </div>
        </div>

        <p
          style={{
            ...BODY,
            fontSize: 12,
            color: "var(--muted)",
            marginTop: 14,
            lineHeight: 1.6,
          }}
        >
          Note: "[first name]" will be replaced with each caregiver&apos;s first name when sent.
          This is a demo preview.
        </p>
      </ModalShell>
    );
  }

  // Step 4: Confirm and send
  return (
    <ModalShell
      title="Ready to send?"
      step={4}
      totalSteps={4}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...BODY,
              height: 48,
              padding: "0 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              border: "1.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, success: true }))}
            style={{
              ...BODY,
              height: 48,
              padding: "0 28px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--primary)",
              color: "var(--white)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Send now
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Trial", value: trialShortName },
          {
            label: "Recipients",
            value: `${state.selectedCaregivers.length} ${
              state.selectedCaregivers.length === 1 ? "caregiver" : "caregivers"
            }`,
          },
          { label: "Sent from", value: "CCF via Clarifer" },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              gap: 12,
              padding: "14px 16px",
              backgroundColor: "var(--background)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                ...BODY,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--muted)",
                minWidth: 100,
                flexShrink: 0,
              }}
            >
              {row.label}
            </div>
            <div style={{ ...BODY, fontSize: 14, color: "var(--text)", lineHeight: 1.4 }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

// ─── Modal 2: Welcome resource ────────────────────────────────────────────────

interface Modal2State {
  step: 1 | 2 | 3 | 4;
  selectedMembers: string[];
  selectedResource: string | null;
  success: boolean;
}

function WelcomeResourceModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<Modal2State>({
    step: 1,
    selectedMembers: NEW_MEMBERS.map((m) => m.name),
    selectedResource: null,
    success: false,
  });

  const allChecked = state.selectedMembers.length === NEW_MEMBERS.length;

  function toggleMember(name: string) {
    setState((s) => ({
      ...s,
      selectedMembers: s.selectedMembers.includes(name)
        ? s.selectedMembers.filter((n) => n !== name)
        : [...s.selectedMembers, name],
    }));
  }

  function setAllMembers(checked: boolean) {
    setState((s) => ({
      ...s,
      selectedMembers: checked ? NEW_MEMBERS.map((m) => m.name) : [],
    }));
  }

  function next() {
    setState((s) => ({ ...s, step: (s.step + 1) as Modal2State["step"] }));
  }

  function back() {
    setState((s) => ({ ...s, step: (s.step - 1) as Modal2State["step"] }));
  }

  const selectedResourceObj = RESOURCES.find((r) => r.id === state.selectedResource);
  const firstName = state.selectedMembers[0]?.split(" ")[0] ?? "Priya";

  if (state.success) {
    return (
      <SuccessScreen
        message={`Your resource has been sent to ${state.selectedMembers.length} new ${
          state.selectedMembers.length === 1 ? "member" : "members"
        }.`}
        onClose={onClose}
      />
    );
  }

  // Step 1: New members
  if (state.step === 1) {
    return (
      <ModalShell
        title="New members this month"
        step={1}
        totalSteps={4}
        onClose={onClose}
        footer={
          <button
            type="button"
            disabled={state.selectedMembers.length === 0}
            onClick={next}
            style={{
              ...BODY,
              height: 48,
              padding: "0 28px",
              borderRadius: "var(--radius-md)",
              backgroundColor:
                state.selectedMembers.length > 0 ? "var(--primary)" : "var(--border)",
              color:
                state.selectedMembers.length > 0 ? "var(--white)" : "var(--muted)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: state.selectedMembers.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Next
          </button>
        }
      >
        <p style={{ ...BODY, fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
          These caregivers joined through CCF in the last 30 days and have not yet received a
          welcome resource.
        </p>

        {/* Select all / Deselect all */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ ...BODY, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {state.selectedMembers.length}{" "}
            {state.selectedMembers.length === 1 ? "caregiver" : "caregivers"} selected
          </span>
          <button
            type="button"
            onClick={() => setAllMembers(!allChecked)}
            style={{
              ...BODY,
              background: "transparent",
              border: "none",
              fontSize: 13,
              color: "var(--primary)",
              fontWeight: 500,
              cursor: "pointer",
              padding: "4px 0",
              minHeight: 44,
            }}
          >
            {allChecked ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* Member list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NEW_MEMBERS.map((m) => {
            const checked = state.selectedMembers.includes(m.name);
            return (
              <label
                key={m.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 10px",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  minHeight: 52,
                  backgroundColor: checked ? "var(--pale-sage)" : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(m.name)}
                  style={{ width: 18, height: 18, flexShrink: 0, accentColor: "var(--primary)", cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {m.name}
                  </div>
                  <div style={{ ...BODY, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    Joined {m.daysAgo} {m.daysAgo === 1 ? "day" : "days"} ago
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </ModalShell>
    );
  }

  // Step 2: Select resource
  if (state.step === 2) {
    return (
      <ModalShell
        title="What would you like to send?"
        step={2}
        totalSteps={4}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={back}
              style={{
                ...BODY,
                height: 48,
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                border: "1.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!state.selectedResource}
              onClick={next}
              style={{
                ...BODY,
                height: 48,
                padding: "0 28px",
                borderRadius: "var(--radius-md)",
                backgroundColor: state.selectedResource ? "var(--primary)" : "var(--border)",
                color: state.selectedResource ? "var(--white)" : "var(--muted)",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: state.selectedResource ? "pointer" : "not-allowed",
              }}
            >
              Next
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RESOURCES.map((r) => {
            const selected = state.selectedResource === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, selectedResource: r.id }))}
                aria-pressed={selected}
                style={{
                  ...BODY,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: selected ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                  backgroundColor: selected ? "var(--pale-sage)" : "var(--card)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  minHeight: 52,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    marginTop: 3,
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: selected ? "5px solid var(--primary)" : "2px solid var(--border)",
                    backgroundColor: "var(--card)",
                    display: "inline-block",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: selected ? 600 : 500,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
                    {r.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ModalShell>
    );
  }

  // Step 3: Preview
  if (state.step === 3) {
    return (
      <ModalShell
        title="Preview your message"
        step={3}
        totalSteps={4}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={back}
              style={{
                ...BODY,
                height: 48,
                padding: "0 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "transparent",
                border: "1.5px solid var(--border)",
                color: "var(--text)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              style={{
                ...BODY,
                height: 48,
                padding: "0 28px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary)",
                color: "var(--white)",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </>
        }
      >
        <div
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "20px",
          }}
        >
          <div
            style={{
              ...BODY,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            Subject
          </div>
          <div
            style={{
              ...BODY,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text)",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            A resource from the Cholangiocarcinoma Foundation
          </div>
          <div
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--text)",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {`Hi ${firstName},\n\nThe Cholangiocarcinoma Foundation wanted to share a resource that may be helpful for you and your family.\n\n${
              selectedResourceObj?.title ?? "[resource name]"
            }: ${selectedResourceObj?.sub ?? ""}\n\nYou can access this resource at clarifer.com/tools or by contacting CCF directly.\n\nYou are receiving this because you joined Clarifer through a CCF partnership. To unsubscribe, reply to this email.\n\nWith care,\nThe CCF Team`}
          </div>
        </div>

        <p
          style={{
            ...BODY,
            fontSize: 12,
            color: "var(--muted)",
            marginTop: 14,
            lineHeight: 1.6,
          }}
        >
          Note: "[first name]" will be replaced with each member&apos;s first name when sent.
          This is a demo preview.
        </p>
      </ModalShell>
    );
  }

  // Step 4: Confirm and send
  return (
    <ModalShell
      title="Ready to send?"
      step={4}
      totalSteps={4}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...BODY,
              height: 48,
              padding: "0 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "transparent",
              border: "1.5px solid var(--border)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, success: true }))}
            style={{
              ...BODY,
              height: 48,
              padding: "0 28px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--primary)",
              color: "var(--white)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Send now
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Resource", value: selectedResourceObj?.title ?? "" },
          {
            label: "Recipients",
            value: `${state.selectedMembers.length} new ${
              state.selectedMembers.length === 1 ? "member" : "members"
            }`,
          },
          { label: "Sent from", value: "CCF via Clarifer" },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              gap: 12,
              padding: "14px 16px",
              backgroundColor: "var(--background)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                ...BODY,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--muted)",
                minWidth: 100,
                flexShrink: 0,
              }}
            >
              {row.label}
            </div>
            <div style={{ ...BODY, fontSize: 14, color: "var(--text)", lineHeight: 1.4 }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

// ─── Section + modal orchestrator ────────────────────────────────────────────

export function ReachCommunity() {
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);

  return (
    <>
      <section
        aria-label="Send to your community"
        style={{
          backgroundColor: "var(--card)",
          border: "2px solid var(--primary)",
          borderRadius: 14,
          padding: 28,
          marginTop: 20,
          marginBottom: 32,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            ...HEADING,
            fontSize: 20,
            fontWeight: 600,
            color: "var(--primary)",
            marginBottom: 6,
          }}
        >
          Send to your community
        </h2>
        <p
          style={{
            ...BODY,
            fontSize: 14,
            color: "var(--muted)",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          When a new trial opens or CCF publishes resources, send directly to matched caregivers.
          Opt-in only.
        </p>

        <div className="flex flex-wrap" style={{ gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setModal1Open(true)}
            aria-label="Send a trial alert to matched caregivers"
            style={{
              ...BODY,
              display: "inline-flex",
              alignItems: "center",
              height: 52,
              padding: "0 24px",
              borderRadius: 10,
              backgroundColor: "var(--primary)",
              color: "var(--white)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Send a trial alert to matched caregivers
          </button>
          <button
            type="button"
            onClick={() => setModal2Open(true)}
            aria-label="Send a welcome resource to new members"
            style={{
              ...BODY,
              display: "inline-flex",
              alignItems: "center",
              height: 52,
              padding: "0 24px",
              borderRadius: 10,
              backgroundColor: "transparent",
              border: "2px solid var(--primary)",
              color: "var(--primary)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Send a welcome resource to new members
          </button>
        </div>

        <p
          style={{
            ...BODY,
            fontSize: 12,
            color: "var(--muted)",
            lineHeight: 1.6,
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          All data is aggregated and anonymized. No individual patients are ever identified.
          Minimum 5 patients per data point shown.
        </p>
      </section>

      {modal1Open && (
        <TrialAlertModal onClose={() => setModal1Open(false)} />
      )}
      {modal2Open && (
        <WelcomeResourceModal onClose={() => setModal2Open(false)} />
      )}
    </>
  );
}
