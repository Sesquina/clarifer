import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { AnalysisTrigger } from "@/components/documents/AnalysisTrigger";
import { stripMarkdown } from "@/lib/family-update/strip-markdown";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc) notFound();

  const findings = (doc.key_findings as Array<{ label: string; value: string; status?: string }>) || [];
  const symptomConnection = (doc as Record<string, unknown>).symptom_connection as string | undefined;

  // Break summary into paragraphs (group sentences into 2-3 sentence chunks)
  function formatSummary(text: string): string[] {
    const sentences = text.split(/(?<=\.)\s+/);
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paragraphs.push(sentences.slice(i, i + 3).join(" "));
    }
    return paragraphs;
  }

  const summaryParagraphs = doc.summary ? formatSummary(stripMarkdown(doc.summary)) : [];

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Link
          href="/documents"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={16} /> Back to documents
        </Link>

        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--text)" }}>
            {doc.title || "Untitled"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            {doc.document_category && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 8,
                backgroundColor: "var(--pale-sage)", color: "var(--primary)",
              }}>
                {doc.document_category}
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(doc.uploaded_at)}</span>
          </div>
        </div>

        {/* AI Summary */}
        {summaryParagraphs.length > 0 && (
          <div style={{
            backgroundColor: "var(--card)", borderRadius: 14, padding: "20px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              AI Summary
            </p>
            {summaryParagraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.7, marginTop: i > 0 ? 12 : 0 }}>
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Trigger analysis if no summary exists yet */}
        {!doc.summary && doc.patient_id && (
          <AnalysisTrigger documentId={doc.id} patientId={doc.patient_id} />
        )}

        {/* Divider */}
        {summaryParagraphs.length > 0 && findings.length > 0 && (
          <div style={{ height: 1, backgroundColor: "var(--border)" }} />
        )}

        {/* Key Findings */}
        {findings.length > 0 && (
          <div style={{
            backgroundColor: "var(--card)", borderRadius: 14, padding: "20px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
              Key Findings
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {findings.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 0",
                    borderBottom: i < findings.length - 1 ? "1px solid #F0EBE3" : "none",
                  }}
                >
                  <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>{f.label}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{f.value}</p>
                    {f.status === "flagged" && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 8,
                        backgroundColor: "#FEF3C7", color: "#B45309",
                      }}>
                        <AlertTriangle size={11} /> Flagged
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What to watch for: symptom connection */}
        {symptomConnection && (
          <div style={{
            backgroundColor: "var(--card)", borderRadius: 14, padding: "20px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            borderLeft: "3px solid var(--accent)",
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              What to watch for
            </p>
            <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.7 }}>
              {symptomConnection}
            </p>
          </div>
        )}

        {/* Original file */}
        {doc.file_url && (
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 20px", borderRadius: 12, border: "1.5px solid var(--border)",
              fontSize: 14, fontWeight: 500, color: "var(--text)", textDecoration: "none",
              backgroundColor: "var(--card)",
            }}
          >
            View original file
          </a>
        )}

        <DeleteDocumentButton documentId={doc.id} redirectTo="/documents" />
      </div>
    </PageContainer>
  );
}
