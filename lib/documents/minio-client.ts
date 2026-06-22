/**
 * lib/documents/minio-client.ts
 * MinIO S3-compatible storage client. Singleton -- one client per process.
 * Replaces Supabase Storage for all document operations.
 * Tables: None
 * Auth: Public (no PHI, pure infrastructure)
 * HIPAA: No PHI in any log line. Filename segment only, never full path.
 */
export const runtime = "nodejs";
import * as Minio from "minio";

let _client: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (_client) return _client;

  const endpoint = process.env.MINIO_ENDPOINT;
  const port = parseInt(process.env.MINIO_PORT ?? "443", 10);
  const useSSL = process.env.MINIO_USE_SSL !== "false";
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      "[minio] Missing env vars: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY"
    );
  }

  _client = new Minio.Client({
    endPoint: endpoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });

  return _client;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "clarifer-documents";
