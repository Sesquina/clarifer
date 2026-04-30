/**
 * extract.ts
 * Converts uploaded file content into a format suitable for Anthropic API consumption.
 * PDFs and images are returned as base64 for native Claude vision/document analysis.
 * Text files are decoded from base64 to UTF-8.
 * Tables: none
 * Auth: none (pure utility)
 * Sprint: fix/document-pipeline
 * HIPAA: No PHI in this file
 */

export function extractContent(
  fileData: string,
  fileType: string
): { type: "text" | "base64"; content: string; mediaType?: string } {
  if (fileType === "application/pdf" || fileType.startsWith("image/")) {
    return { type: "base64", content: fileData, mediaType: fileType };
  }
  const decoded = Buffer.from(fileData, "base64").toString("utf8");
  return { type: "text", content: decoded };
}
