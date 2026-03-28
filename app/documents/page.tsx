import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("created_by", user.id)
    .limit(1)
    .single();

  const { data: documents } = patient
    ? await supabase
        .from("documents")
        .select("*")
        .eq("patient_id", patient.id)
        .order("uploaded_at", { ascending: false })
    : { data: [] };

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Documents</h1>
          <Link
            href="/documents/upload"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
        </div>

        {(!documents || documents.length === 0) ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
              <p className="text-xs text-muted-foreground">Upload lab results, imaging, or clinical notes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{doc.title || "Untitled"}</CardTitle>
                      {doc.document_category && (
                        <Badge variant="secondary">{doc.document_category}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.uploaded_at)}
                      {doc.file_type && ` \u00B7 ${doc.file_type.toUpperCase()}`}
                    </p>
                    {doc.summary && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{doc.summary}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
