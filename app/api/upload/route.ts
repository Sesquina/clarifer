import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log("[upload] Starting upload handler");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[upload] Authenticated user:", user.id);

    // Parse JSON body with base64 file data
    const { fileName, fileType, fileSize, fileData, patientId } = await request.json();
    console.log("[upload] JSON parsed — fileName:", fileName, "size:", fileSize, "patientId:", patientId);

    if (!fileData || !fileName || !patientId) {
      return NextResponse.json({ error: "Missing fileData, fileName, or patientId" }, { status: 400 });
    }

    // Service role client for storage (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${patientId}/${timestamp}_${safeName}`;

    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, "base64");
    console.log("[upload] Buffer created, size:", buffer.length);

    // Upload to storage
    console.log("[upload] Uploading to storage, path:", path);
    const { error: uploadError } = await serviceClient.storage
      .from("documents")
      .upload(path, buffer, {
        contentType: fileType || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });
    console.log("[upload] Storage upload complete, error:", uploadError?.message || "none");

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Signed URL
    console.log("[upload] Creating signed URL");
    const { data: urlData } = await serviceClient.storage
      .from("documents")
      .createSignedUrl(path, 3600);
    console.log("[upload] Signed URL created:", !!urlData?.signedUrl);

    const fileUrl = urlData?.signedUrl || "";

    // DB insert
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const category = ["pdf"].includes(ext) ? "lab_result" : "other";

    console.log("[upload] Inserting document record");
    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        patient_id: patientId,
        uploaded_by: user.id,
        file_url: fileUrl,
        file_type: ext,
        title: fileName,
        document_category: category,
      })
      .select()
      .single();
    console.log("[upload] DB insert complete, docId:", doc?.id, "error:", insertError?.message || "none");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log("[upload] Success — returning response");
    return NextResponse.json({
      documentId: doc.id,
      fileUrl,
      fileName,
      fileType: ext,
    });
  } catch (err) {
    console.error("[upload] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
