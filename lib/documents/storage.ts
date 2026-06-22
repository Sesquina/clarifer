/**
 * lib/documents/storage.ts
 * Document storage using MinIO on Hetzner. Replaces Supabase Storage.
 * Tables: None
 * Auth: Public (no PHI, pure infrastructure)
 * HIPAA: No PHI in logs. safeFilename() strips path, logs filename only.
 */
import { getMinioClient, MINIO_BUCKET } from "./minio-client";
import { Readable } from "stream";

function safeFilename(filePath: string): string {
  return filePath.split("/").pop() ?? "unknown";
}

export async function uploadToStorage(
  file: File,
  orgId: string,
  patientId: string
): Promise<string> {
  const client = getMinioClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `${orgId}/${patientId}/${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const stream = Readable.from(buffer);

  await client.putObject(
    MINIO_BUCKET,
    filePath,
    stream,
    buffer.length,
    { "Content-Type": file.type }
  );

  console.log("[minio] upload succeeded:", safeFilename(filePath));
  return filePath;
}

export async function generateSignedUrl(filePath: string): Promise<string> {
  const client = getMinioClient();
  const url = await client.presignedGetObject(MINIO_BUCKET, filePath, 3600);
  console.log("[minio] signed URL generated:", safeFilename(filePath));
  return url;
}

export async function deleteFromStorage(filePath: string): Promise<void> {
  const client = getMinioClient();
  await client.removeObject(MINIO_BUCKET, filePath);
  console.log("[minio] deleted:", safeFilename(filePath));
}
