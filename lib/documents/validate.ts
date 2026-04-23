export const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

export function validateFile(file: { size: number; type: string; name: string }): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File exceeds 50 MB limit" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${ALLOWED_TYPES.join(", ")}`,
    };
  }
  return { valid: true };
}
