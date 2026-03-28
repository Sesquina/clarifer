import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  const findings = doc.key_findings as Array<{ label: string; value: string }> | null;

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to documents
        </Link>

        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>{doc.title || "Untitled"}</h1>
          <div className="mt-1 flex items-center gap-2">
            {doc.document_category && <Badge variant="secondary">{doc.document_category}</Badge>}
            <span className="text-xs text-muted-foreground">{formatDate(doc.uploaded_at)}</span>
          </div>
        </div>

        {doc.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{doc.summary}</p>
            </CardContent>
          </Card>
        )}

        {findings && findings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {findings.map((f, i) => (
                  <div key={i}>
                    <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                    <dd className="text-sm">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {doc.file_url && (
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            View original file
          </a>
        )}
      </div>
    </PageContainer>
  );
}
