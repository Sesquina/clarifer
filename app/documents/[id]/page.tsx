import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Bookmark } from "lucide-react";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { AnalysisTrigger } from "@/components/documents/AnalysisTrigger";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneticFinding {
  marker: string;
  result: string;
  plain_language: string;
}

interface LabFinding {
  test: string;
  value: string;
  status: "HIGH" | "LOW";
  plain_language: string;
}

interface ImagingFinding {
  // string items for IMAGING_REPORT key_findings array
}

interface AnalysisData {
  summary?: string;
  // GENETIC_REPORT
  key_findings?: GeneticFinding[] | string[];
  not_detected?: string[];
  action_items?: string[];
  clinical_trials_note?: string;
  // LAB_RESULTS
  abnormal_values?: LabFinding[];
  normal_values_summary?: string;
  pattern?: string;
  // PROCEDURE_REPORT
  what_was_found?: string;
  what_was_done?: string;
  follow_up?: string;
  // IMAGING_REPORT
  what_is_normal?: string;
  urgency?: string;
  // CLINICAL_NOTE
  reason_for_visit?: string;
  medications_mentioned?: string[];
}

type DocumentType =
  | "GENETIC_REPORT"
  | "LAB_RESULTS"
  | "PROCEDURE_REPORT"
  | "IMAGING_REPORT"
  | "CLINICAL_NOTE"
  | "LEGAL_ADMINISTRATIVE"
  | "OTHER"
  | string
  | null;

const NEW_FORMAT_TYPES = new Set([
  "GENETIC_REPORT",
  "LAB_RESULTS",
  "PROCEDURE_REPORT",
  "IMAGING_REPORT",
  "CLINICAL_NOTE",
  "LEGAL_ADMINISTRATIVE",
  "OTHER",
]);

// ── Style helpers ─────────────────────────────────────────────────────────────

const sectionCard: React.CSSProperties = {
  backgroundColor: "var(--card)",
  borderRadius: 14,
  padding: "20px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
  fontSize: 18,
  fontWeight: 500,
  color: "var(--text)",
  marginBottom: 12,
};

const dmSans: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

function SummarySection({ summary }: { summary: string }) {
  return (
    <div style={sectionCard}>
      <p style={sectionHeading}>What this says</p>
      <div
        style={{
          backgroundColor: "var(--pale-sage)",
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        <p style={{ ...dmSans, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
          {summary}
        </p>
      </div>
    </div>
  );
}

function LegalWarning({ summary }: { summary: string }) {
  return (
    <div
      style={{
        ...sectionCard,
        backgroundColor: "#FFFBEB",
        border: "1px solid #FDE68A",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <AlertTriangle size={18} style={{ color: "#B45309", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p
            style={{
              ...dmSans,
              fontSize: 13,
              fontWeight: 600,
              color: "#B45309",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Legal / Administrative Document
          </p>
          <p style={{ ...dmSans, fontSize: 14, color: "#92400E", lineHeight: 1.6 }}>
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}

function GeneticFindings({ findings }: { findings: GeneticFinding[] }) {
  if (!findings.length) return null;
  return (
    <div style={sectionCard}>
      <p style={sectionHeading}>Key findings</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {findings.map((f, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ ...dmSans, fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
              {f.marker}
              {f.result && (
                <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 6 }}>
                  — {f.result}
                </span>
              )}
            </p>
            <p style={{ ...dmSans, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              {f.plain_language}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabAbnormalValues({ values }: { values: LabFinding[] }) {
  if (!values.length) return null;
  return (
    <div style={sectionCard}>
      <p style={sectionHeading}>Key findings</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {values.map((f, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <p style={{ ...dmSans, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {f.test}
              </p>
              <span style={{ ...dmSans, fontSize: 13, color: "var(--text)" }}>{f.value}</span>
              {f.status && (
                <span
                  style={{
                    ...dmSans,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor:
                      f.status === "HIGH"
                        ? "rgba(var(--severity-high-rgb, 220, 38, 38), 0.1)"
                        : "rgba(186, 117, 23, 0.1)",
                    color: f.status === "HIGH" ? "var(--severity-high, #DC2626)" : "#BA7517",
                  }}
                >
                  {f.status}
                </span>
              )}
            </div>
            <p style={{ ...dmSans, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              {f.plain_language}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StringFindings({ heading, items }: { heading: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div style={sectionCard}>
      <p style={sectionHeading}>{heading}</p>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              ...dmSans,
              fontSize: 14,
              color: "var(--text)",
              lineHeight: 1.6,
              marginBottom: 6,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotDetected({ markers }: { markers: string[] }) {
  if (!markers.length) return null;
  return (
    <div
      style={{
        ...sectionCard,
        backgroundColor: "#FDF5F0",
        border: "1px solid #E8D5C8",
      }}
    >
      <p style={{ ...sectionHeading, color: "var(--text)" }}>Important markers not found</p>
      <p
        style={{
          ...dmSans,
          fontSize: 13,
          color: "var(--muted)",
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        The absence of these markers may affect treatment options. Ask your care team what this
        means for next steps.
      </p>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {markers.map((m, i) => (
          <li
            key={i}
            style={{ ...dmSans, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 4 }}
          >
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionItems({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div style={sectionCard}>
      <p style={sectionHeading}>Recommended next steps</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              borderLeft: "3px solid var(--primary)",
              backgroundColor: "var(--pale-sage)",
              padding: "10px 14px",
              borderRadius: "0 8px 8px 0",
            }}
          >
            <p style={{ ...dmSans, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClinicalTrialsNote({ note }: { note: string }) {
  return (
    <div
      style={{
        ...sectionCard,
        backgroundColor: "#FDF5F0",
        border: "1px solid #E8D5C8",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <Bookmark size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <p style={{ ...dmSans, fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>
          {note}
        </p>
      </div>
      <Link
        href="/tools/trials"
        style={{
          ...dmSans,
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 16px",
          borderRadius: 20,
          backgroundColor: "var(--primary)",
          color: "var(--card)",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Search matching trials
      </Link>
    </div>
  );
}

function ProseField({ heading, text }: { heading: string; text: string }) {
  return (
    <div style={sectionCard}>
      <p style={sectionHeading}>{heading}</p>
      <p style={{ ...dmSans, fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

// ── Legacy rendering (old format documents) ───────────────────────────────────

function LegacySummary({ summary }: { summary: string }) {
  function formatSummary(text: string): string[] {
    const sentences = text.split(/(?<=\.)\s+/);
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paragraphs.push(sentences.slice(i, i + 3).join(" "));
    }
    return paragraphs;
  }

  const paragraphs = formatSummary(summary);
  return (
    <div style={sectionCard}>
      <p
        style={{
          ...dmSans,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
        }}
      >
        AI Summary
      </p>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 15,
            color: "var(--text)",
            lineHeight: 1.7,
            marginTop: i > 0 ? 12 : 0,
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: doc } = await supabase.from("documents").select("*").eq("id", id).single();

  if (!doc) notFound();

  const docType = (doc.document_category as DocumentType) ?? null;
  const isNewFormat = NEW_FORMAT_TYPES.has(docType ?? "");
  const analysis = isNewFormat ? (doc.key_findings as AnalysisData | null) : null;
  const summary = (doc.summary as string | null) ?? "";

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back link */}
        <Link
          href="/documents"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "var(--muted)",
            textDecoration: "none",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          <ArrowLeft size={16} /> Back to documents
        </Link>

        {/* Header */}
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--text)" }}>
            {(doc.title as string) || (doc.file_name as string) || "Untitled"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            {docType && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: 8,
                  backgroundColor: "var(--pale-sage)",
                  color: "var(--primary)",
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {docType.replace(/_/g, " ")}
              </span>
            )}
            <span
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              {formatDate((doc.uploaded_at as string) ?? (doc.created_at as string))}
            </span>
          </div>
        </div>

        {/* Trigger analysis if no summary */}
        {!summary && (doc.patient_id as string | null) && (
          <AnalysisTrigger documentId={doc.id as string} patientId={doc.patient_id as string} />
        )}

        {/* ── Type-aware rendering ── */}
        {isNewFormat && summary && (
          <>
            {/* Legal/Administrative: amber warning, no further sections */}
            {docType === "LEGAL_ADMINISTRATIVE" ? (
              <LegalWarning summary={summary} />
            ) : (
              <>
                {/* Summary */}
                <SummarySection summary={summary} />

                {/* GENETIC_REPORT: structured findings */}
                {docType === "GENETIC_REPORT" && analysis && (
                  <>
                    {Array.isArray(analysis.key_findings) && analysis.key_findings.length > 0 && (
                      <GeneticFindings
                        findings={analysis.key_findings as GeneticFinding[]}
                      />
                    )}
                    {Array.isArray(analysis.not_detected) && analysis.not_detected.length > 0 && (
                      <NotDetected markers={analysis.not_detected} />
                    )}
                    {analysis.clinical_trials_note && (
                      <ClinicalTrialsNote note={analysis.clinical_trials_note} />
                    )}
                  </>
                )}

                {/* LAB_RESULTS */}
                {docType === "LAB_RESULTS" && analysis && (
                  <>
                    {Array.isArray(analysis.abnormal_values) &&
                      analysis.abnormal_values.length > 0 && (
                        <LabAbnormalValues values={analysis.abnormal_values} />
                      )}
                    {analysis.pattern && (
                      <ProseField heading="Clinical pattern" text={analysis.pattern} />
                    )}
                    {analysis.normal_values_summary && (
                      <ProseField
                        heading="What was normal"
                        text={analysis.normal_values_summary}
                      />
                    )}
                  </>
                )}

                {/* PROCEDURE_REPORT */}
                {docType === "PROCEDURE_REPORT" && analysis && (
                  <>
                    {analysis.what_was_found && (
                      <ProseField heading="What was found" text={analysis.what_was_found} />
                    )}
                    {analysis.what_was_done && (
                      <ProseField heading="What was done" text={analysis.what_was_done} />
                    )}
                    {analysis.follow_up && (
                      <ProseField heading="Follow-up" text={analysis.follow_up} />
                    )}
                  </>
                )}

                {/* IMAGING_REPORT */}
                {docType === "IMAGING_REPORT" && analysis && (
                  <>
                    {Array.isArray(analysis.key_findings) && analysis.key_findings.length > 0 && (
                      <StringFindings
                        heading="Key findings"
                        items={analysis.key_findings as string[]}
                      />
                    )}
                    {analysis.urgency && (
                      <ProseField heading="Urgency" text={analysis.urgency} />
                    )}
                    {analysis.what_is_normal && (
                      <ProseField heading="What was normal" text={analysis.what_is_normal} />
                    )}
                  </>
                )}

                {/* CLINICAL_NOTE */}
                {docType === "CLINICAL_NOTE" && analysis && (
                  <>
                    {analysis.reason_for_visit && (
                      <ProseField heading="Reason for visit" text={analysis.reason_for_visit} />
                    )}
                    {Array.isArray(analysis.key_findings) && analysis.key_findings.length > 0 && (
                      <StringFindings
                        heading="Key findings"
                        items={analysis.key_findings as string[]}
                      />
                    )}
                    {analysis.what_was_done && (
                      <ProseField heading="What was done" text={analysis.what_was_done} />
                    )}
                    {Array.isArray(analysis.medications_mentioned) &&
                      analysis.medications_mentioned.length > 0 && (
                        <StringFindings
                          heading="Medications mentioned"
                          items={analysis.medications_mentioned}
                        />
                      )}
                  </>
                )}

                {/* OTHER */}
                {docType === "OTHER" && analysis && (
                  <>
                    {Array.isArray(analysis.key_findings) && analysis.key_findings.length > 0 && (
                      <StringFindings
                        heading="Key findings"
                        items={analysis.key_findings as string[]}
                      />
                    )}
                  </>
                )}

                {/* Action items (all types except LEGAL) */}
                {analysis && Array.isArray(analysis.action_items) &&
                  analysis.action_items.length > 0 && (
                    <ActionItems items={analysis.action_items} />
                  )}
              </>
            )}
          </>
        )}

        {/* ── Legacy rendering (pre-v2 documents) ── */}
        {!isNewFormat && summary && <LegacySummary summary={summary} />}

        {/* Original file */}
        {(doc.file_url as string | null) && (
          <a
            href={doc.file_url as string}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              border: "1.5px solid var(--border)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text)",
              textDecoration: "none",
              backgroundColor: "var(--card)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            View original file
          </a>
        )}

        <DeleteDocumentButton documentId={doc.id as string} redirectTo="/documents" />
      </div>
    </PageContainer>
  );
}
