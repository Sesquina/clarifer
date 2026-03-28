import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
  // Auth check via the user's session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const patientId = formData.get("patientId") as string | null;

  if (!file || !patientId) {
    return NextResponse.json({ error: "Missing file or patientId" }, { status: 400 });
  }

  // Use service role client for storage (bypasses RLS)
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${patientId}/${timestamp}_${safeName}`;

  // Upload file
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await serviceClient.storage
    .from("documents")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get signed URL
  const { data: urlData } = await serviceClient.storage
    .from("documents")
    .createSignedUrl(path, 3600);

  const fileUrl = urlData?.signedUrl || "";

  // Insert document record (using user's session client for RLS)
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const category = ["pdf"].includes(ext) ? "lab_result" : "other";

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      patient_id: patientId,
      uploaded_by: user.id,
      file_url: fileUrl,
      file_type: ext,
      title: file.name,
      document_category: category,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Document insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    documentId: doc.id,
    fileUrl,
    fileName: file.name,
    fileType: ext,
  });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
