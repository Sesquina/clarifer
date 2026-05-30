/**
 * app/demo/session/page.tsx
 * Demo-only screen: CCF group session documentation with live-editable form
 * and client-side billing summary PDF generation.
 * Tables: None
 * Auth: Public
 * HIPAA: No PHI in this file. All data is demo data only.
 */
"use client";

import { useState } from "react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  sessionName: string;
  sessionDate: string;
  facilitatorName: string;
  physicianName: string;
  duration: number;
  content: string;
}

interface AttendeeItem {
  caregiver: string;
  patient: string;
}

// ─── PDF colors — hex only; CSS variables unavailable in @react-pdf/renderer ──

const PDF_COLORS = {
  PRIMARY: "#2C5F4A",
  TEXT: "#1A1A1A",
  MUTED: "#6B6B6B",
  BORDER: "#E8E2D9",
  WHITE: "#FFFFFF",
  ROW_ALT: "#F9F9F9",
  HEADER_BG: "#2C5F4A",
  HEADER_TEXT: "#FFFFFF",
} as const;

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: PDF_COLORS.TEXT, fontFamily: "Helvetica" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  brandName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: PDF_COLORS.PRIMARY },
  docType: { fontSize: 10, color: PDF_COLORS.MUTED, textTransform: "uppercase" },
  rule: { borderBottomWidth: 1, borderBottomColor: PDF_COLORS.BORDER, marginVertical: 8 },
  detailsContainer: { flexDirection: "row", marginTop: 8, marginBottom: 16 },
  detailsCol: { flex: 1 },
  detailItem: { marginBottom: 8 },
  detailLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.MUTED,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailValue: { fontSize: 12, color: PDF_COLORS.TEXT },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.MUTED,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 4,
  },
  sectionSubLabel: { fontSize: 10, color: PDF_COLORS.MUTED, marginBottom: 8 },
  contentBody: { fontSize: 11, color: PDF_COLORS.TEXT, lineHeight: 1.5, marginBottom: 8 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: PDF_COLORS.HEADER_BG },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.HEADER_TEXT,
    textTransform: "uppercase",
    padding: 6,
  },
  tableRow: { flexDirection: "row" },
  tableCell: { fontSize: 11, color: PDF_COLORS.TEXT, padding: 6 },
  disclaimer: {
    fontSize: 9,
    color: PDF_COLORS.MUTED,
    fontStyle: "italic",
    marginTop: 16,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.BORDER,
    paddingTop: 4,
  },
  footerText: { fontSize: 9, color: PDF_COLORS.MUTED, textAlign: "center" },
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ─── PDF component — pure, browser-rendered via pdf().toBlob() ────────────────

function SessionBillingDocument({
  form,
  attendees,
}: {
  form: FormState;
  attendees: AttendeeItem[];
}) {
  const todayFormatted = formatDate(new Date().toISOString().split("T")[0]);

  const billingCodes = [
    {
      code: "CPT 97552",
      description:
        "Group caregiver training in strategies and techniques to facilitate patient functional performance (without patient present, multiple caregivers of different patients)",
      units: `${attendees.length} (one per patient)`,
    },
    {
      code: "HCPCS G0023",
      description:
        "Principal illness navigation services by certified or trained auxiliary personnel, 60 minutes per calendar month",
      units: `${attendees.length} (one per patient)`,
    },
  ];

  return (
    <Document
      title={`Group Session -- ${form.sessionDate}`}
      author="Clarifer"
      producer="Clarifer"
    >
      <Page size="LETTER" wrap style={pdfStyles.page}>

        {/* 1 -- Header */}
        <View style={pdfStyles.headerRow}>
          <Text style={pdfStyles.brandName}>Clarifer</Text>
          <Text style={pdfStyles.docType}>Billing Support Document</Text>
        </View>
        <View style={pdfStyles.rule} />

        {/* 2 -- Session details: two-column */}
        <View style={pdfStyles.detailsContainer}>
          <View style={pdfStyles.detailsCol}>
            <View style={pdfStyles.detailItem}>
              <Text style={pdfStyles.detailLabel}>Session</Text>
              <Text style={pdfStyles.detailValue}>{form.sessionName}</Text>
            </View>
            <View style={pdfStyles.detailItem}>
              <Text style={pdfStyles.detailLabel}>Date</Text>
              <Text style={pdfStyles.detailValue}>{formatDate(form.sessionDate)}</Text>
            </View>
            <View style={pdfStyles.detailItem}>
              <Text style={pdfStyles.detailLabel}>Duration</Text>
              <Text style={pdfStyles.detailValue}>{form.duration} minutes</Text>
            </View>
          </View>
          <View style={pdfStyles.detailsCol}>
            <View style={pdfStyles.detailItem}>
              <Text style={pdfStyles.detailLabel}>Facilitator</Text>
              <Text style={pdfStyles.detailValue}>{form.facilitatorName}</Text>
            </View>
            <View style={pdfStyles.detailItem}>
              <Text style={pdfStyles.detailLabel}>Supervising Physician</Text>
              <Text style={pdfStyles.detailValue}>{form.physicianName}</Text>
            </View>
          </View>
        </View>

        {/* 3 -- Session content */}
        <Text style={pdfStyles.sectionLabel}>Session Content Covered</Text>
        <Text style={pdfStyles.contentBody}>{form.content}</Text>

        {/* 4 -- Attendee roster */}
        <Text style={pdfStyles.sectionLabel}>Attendee Roster</Text>
        <Text style={pdfStyles.sectionSubLabel}>One billing claim per patient represented.</Text>
        <View style={pdfStyles.tableHeaderRow}>
          <Text style={[pdfStyles.tableHeaderCell, { width: 30 }]}>#</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Caregiver Name</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Patient (First Name)</Text>
        </View>
        {attendees.map((a, i) => (
          <View
            key={i}
            style={[
              pdfStyles.tableRow,
              { backgroundColor: i % 2 === 1 ? PDF_COLORS.ROW_ALT : PDF_COLORS.WHITE },
            ]}
          >
            <Text style={[pdfStyles.tableCell, { width: 30 }]}>{i + 1}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{a.caregiver}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{a.patient}</Text>
          </View>
        ))}

        {/* 5 -- Billing codes */}
        <Text style={pdfStyles.sectionLabel}>Applicable Billing Codes</Text>
        <View style={pdfStyles.tableHeaderRow}>
          <Text style={[pdfStyles.tableHeaderCell, { width: 80 }]}>Code</Text>
          <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Description</Text>
          <Text style={[pdfStyles.tableHeaderCell, { width: 100 }]}>Units</Text>
        </View>
        {billingCodes.map((bc, i) => (
          <View
            key={bc.code}
            style={[
              pdfStyles.tableRow,
              { backgroundColor: i % 2 === 1 ? PDF_COLORS.ROW_ALT : PDF_COLORS.WHITE },
            ]}
          >
            <Text style={[pdfStyles.tableCell, { width: 80 }]}>{bc.code}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{bc.description}</Text>
            <Text style={[pdfStyles.tableCell, { width: 100 }]}>{bc.units}</Text>
          </View>
        ))}

        {/* 6 -- Disclaimer */}
        <Text style={pdfStyles.disclaimer}>
          This document is generated by Clarifer Corp as care coordination documentation. It is not a
          claim submission. The supervising physician practice is responsible for claim submission,
          eligibility verification, and compliance with CMS billing requirements. CPT 97552 requires a
          physician-established plan of care that includes caregiver training. HCPCS G0023 requires a
          qualifying initiating visit with the billing practitioner. Clarifer Corp makes no
          representation regarding reimbursement outcomes.
        </Text>

        {/* 7 -- Footer: fixed, repeats on every page */}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>
            Generated by Clarifer -- clarifer.com -- {todayFormatted}
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ─── Page UI style helpers (CSS variables only — no hex) ─────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--muted)",
  display: "block",
  marginBottom: 6,
  marginTop: 0,
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

const inputBase: React.CSSProperties = {
  height: 48,
  borderRadius: 12,
  border: "1px solid var(--border)",
  fontSize: 15,
  color: "var(--text)",
  padding: "0 14px",
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
  boxSizing: "border-box",
  backgroundColor: "var(--card)",
  outline: "none",
};

const cardBase: React.CSSProperties = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function SessionPage() {
  const [form, setForm] = useState<FormState>({
    sessionName: "CCF Caregiver Support Group",
    sessionDate: new Date().toISOString().split("T")[0],
    facilitatorName: "Melinda Bachini",
    physicianName: "Dr. Sarah Chen, MD -- Oncology",
    duration: 60,
    content:
      "Topics covered: Managing medication side effects at home, coordinating with oncology care team, nutrition support strategies, accessing CCF resources and clinical trial information, emotional support and caregiver self-care techniques.",
  });

  const [attendees, setAttendees] = useState<AttendeeItem[]>([
    { caregiver: "Maria Santos", patient: "Carlos" },
    { caregiver: "James Whitfield", patient: "Patricia" },
    { caregiver: "Diane Park", patient: "Robert" },
    { caregiver: "Angela Torres", patient: "Linda" },
    { caregiver: "Thomas Reed", patient: "Frank" },
  ]);

  const [generating, setGenerating] = useState(false);

  const updateAttendee = (index: number, field: keyof AttendeeItem, value: string) => {
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const removeAttendee = (index: number) => {
    setAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  const addAttendee = () => {
    setAttendees((prev) => [...prev, { caregiver: "", patient: "" }]);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await pdf(
        <SessionBillingDocument form={form} attendees={attendees} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      alert("PDF generation failed. See console for details.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <style>{`
        .session-wrapper { padding: 40px 40px 80px; }
        .session-title  { font-size: 32px; }
        @media (max-width: 480px) {
          .session-wrapper { padding: 24px 24px 80px; }
          .session-title  { font-size: 26px; }
        }
      `}</style>

      <div
        className="session-wrapper"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        }}
      >
        {/* Page header */}
        <h1
          className="session-title"
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          Group Session Documentation
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--muted)",
            marginBottom: 24,
            marginTop: 0,
            lineHeight: 1.6,
          }}
        >
          Document a caregiver group session and generate a billing summary for your clinical partner.
        </p>

        {/* Info card */}
        <div
          style={{
            backgroundColor: "var(--pale-sage)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 32,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>
            This documentation supports billing for CPT 97552 (group caregiver training) and HCPCS G0023
            (principal illness navigation) by the supervising physician practice. Clarifer does not bill.
            The physician partner submits the claim using this summary as supporting documentation.
          </p>
        </div>

        {/* Form card */}
        <div style={cardBase}>
          <div>
            <label style={labelStyle} htmlFor="sessionName">
              Session Name
            </label>
            <input
              id="sessionName"
              type="text"
              value={form.sessionName}
              onChange={(e) => setForm({ ...form, sessionName: e.target.value })}
              style={{ ...inputBase, width: "100%" }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="sessionDate">
              Session Date
            </label>
            <input
              id="sessionDate"
              type="date"
              value={form.sessionDate}
              onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
              style={{ ...inputBase, width: "100%" }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="facilitatorName">
              Facilitator Name
            </label>
            <input
              id="facilitatorName"
              type="text"
              value={form.facilitatorName}
              onChange={(e) => setForm({ ...form, facilitatorName: e.target.value })}
              style={{ ...inputBase, width: "100%" }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="physicianName">
              Supervising Physician
            </label>
            <input
              id="physicianName"
              type="text"
              value={form.physicianName}
              onChange={(e) => setForm({ ...form, physicianName: e.target.value })}
              style={{ ...inputBase, width: "100%" }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="duration">
              Session Duration (Minutes)
            </label>
            <input
              id="duration"
              type="number"
              min={1}
              max={480}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              style={{ ...inputBase, width: "100%" }}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="content">
              Session Content Covered
            </label>
            <textarea
              id="content"
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              style={{
                ...inputBase,
                width: "100%",
                height: "auto",
                minHeight: 120,
                padding: 14,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Attendees card */}
        <div style={{ ...cardBase, marginTop: 24 }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: 4 }}>Attendees</p>
            <p
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 4,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Each row represents one caregiver and the patient they support. CPT 97552 is billed once
              per patient represented.
            </p>

            {attendees.map((a, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}
              >
                <input
                  type="text"
                  placeholder="Caregiver name"
                  value={a.caregiver}
                  onChange={(e) => updateAttendee(i, "caregiver", e.target.value)}
                  style={{ ...inputBase, flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Patient first name"
                  value={a.patient}
                  onChange={(e) => updateAttendee(i, "patient", e.target.value)}
                  style={{ ...inputBase, flex: 1 }}
                />
                {attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttendee(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: 13,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      padding: 0,
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addAttendee}
              style={{
                background: "none",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                borderRadius: 12,
                height: 44,
                padding: "0 16px",
                fontSize: 14,
                cursor: "pointer",
                marginTop: 4,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              + Add attendee
            </button>
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            backgroundColor: generating ? "var(--muted)" : "var(--primary)",
            color: "var(--card)",
            border: "none",
            fontSize: 15,
            fontWeight: 600,
            cursor: generating ? "not-allowed" : "pointer",
            marginTop: 32,
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          {generating ? "Generating..." : "Generate Billing Summary →"}
        </button>
      </div>
    </>
  );
}
