"use client";
import { useRef, useState } from "react";

interface Props {
  patientId: string;
  patientName: string;
  onSuccess?: (documentId: string) => void;
}

export function DocumentUploadForm({ patientId, patientName, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setStatus("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", patientId);
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Upload failed");
      }
      const body = await res.json();
      setStatus("success");
      onSuccess?.(body.id);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (status === "success") {
    return <p aria-live="polite">Document uploaded successfully for {patientName}.</p>;
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Upload document">
      <label htmlFor="doc-file">Choose file (PDF or image, max 50 MB)</label>
      <input
        id="doc-file"
        type="file"
        ref={fileRef}
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
        aria-label="Choose file"
      />
      <button type="submit" disabled={status === "uploading"} aria-label="Upload">
        {status === "uploading" ? "Uploading…" : "Upload"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
