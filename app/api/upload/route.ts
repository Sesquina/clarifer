import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { uploadLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "txt", "csv", "md"];

// Magic byte signatures
const MAGIC_BYTES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
};

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  const expected = MAGIC_BYTES[ext];
  if (!expected) return true; // txt, csv, md — no magic bytes to check
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

export const maxDuration = 60;

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!userRecord?.organization_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["caregiver", "provider"].includes(userRecord.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = userRecord.organization_id;

    const { success } = await uploadLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
    }

    const { fileName, fileType, fileSize, fileData, patientId } = await request.json();

    if (!fileData || !fileName || !patientId) {
      return NextResponse.json({ error: "Missing fileData, fileName, or patientId" }, { status: 400 });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File is too large. Maximum size is 50MB." }, { status: 400 });
    }

    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `File type .${ext} is not supported. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}` }, { status: 400 });
    }

    const buffer = Buffer.from(fileData, "base64");

    // Magic bytes validation
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json({ error: "File type does not match its extension. Please upload a valid file." }, { status: 400 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${patientId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await serviceClient.storage
      .from("documents")
      .upload(path, buffer, {
        contentType: fileType || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = await serviceClient.storage
      .from("documents")
      .createSignedUrl(path, 3600);

    const fileUrl = urlData?.signedUrl || "";
    const category = ["pdf"].includes(ext) ? "lab_result" : "other";

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        patient_id: patientId,
        uploaded_by: user.id,
        file_url: fileUrl,
        file_type: ext,
        title: fileName,
        document_category: category,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      documentId: doc.id,
      fileUrl,
      fileName,
      fileType: ext,
    });
  } catch {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
