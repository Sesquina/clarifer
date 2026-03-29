"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { UploadCloud, ArrowLeft, FileText, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

type Status = "idle" | "reading" | "uploading" | "analyzing" | "done" | "error";

export default function UploadPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", user.id)
        .limit(1)
        .single();
      if (patient) setPatientId(patient.id);
    }
    load();
  }, [supabase]);

  async function handleFile(file: File) {
    if (!patientId) return;
    setFileName(file.name);
    setStatus("reading");
    setErrorMsg("");

    let fileData: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      fileData = btoa(binary);
    } catch {
      setStatus("error");
      setErrorMsg("This file could not be read. If it is stored in iCloud or Google Drive, please download it to your device first.");
      return;
    }

    setStatus("uploading");

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          fileData,
          patientId,
        }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: `HTTP ${uploadRes.status}` }));
        setStatus("error");
        setErrorMsg(err.error || "Upload failed");
        return;
      }

      const { documentId } = await uploadRes.json();

      // Analyze
      setStatus("analyzing");

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let fileContent = "";
      if (["txt", "csv", "md"].includes(ext)) {
        fileContent = atob(fileData);
      } else {
        fileContent = `[${ext.toUpperCase()} file: ${file.name}, ${(file.size / 1024).toFixed(1)}KB]`;
      }

      await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, content: fileContent }),
      });

      setStatus("done");
      setTimeout(() => router.push("/documents"), 1500);
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const statusMessages: Record<Status, string> = {
    idle: "",
    reading: "Reading file...",
    uploading: "Uploading to secure storage...",
    analyzing: "Analyzing with AI...",
    done: "Done. Redirecting...",
    error: errorMsg,
  };

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Link
          href="/documents"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#6B6B6B", textDecoration: "none" }}
        >
          <ArrowLeft size={16} /> Documents
        </Link>

        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "#1A1A1A" }}>
          Upload a document
        </h1>
        <p style={{ fontSize: 15, color: "#6B6B6B", marginTop: -12 }}>
          Discharge summaries, lab results, pathology reports, clinical notes.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => status === "idle" && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            border: "2px dashed #E8E2D9",
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            cursor: status === "idle" ? "pointer" : "default",
            backgroundColor: status === "idle" ? "#FFFFFF" : "#F7F2EA",
            transition: "background-color 0.2s",
          }}
        >
          {status === "idle" && (
            <>
              <UploadCloud size={40} color="#2C5F4A" style={{ margin: "0 auto" }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginTop: 16 }}>
                Tap to select a file
              </p>
              <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
                or drag and drop here
              </p>
              <p style={{ fontSize: 12, color: "#6B6B6B", marginTop: 12 }}>
                PDF, TXT, CSV, DOC, DOCX, PNG, JPG
              </p>
            </>
          )}

          {(status === "reading" || status === "uploading" || status === "analyzing") && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Loader2 size={32} color="#2C5F4A" className="animate-spin" />
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{fileName}</p>
                <p style={{ fontSize: 14, color: "#2C5F4A", marginTop: 4 }}>{statusMessages[status]}</p>
              </div>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {["reading", "uploading", "analyzing"].map((step, i) => {
                  const steps = ["reading", "uploading", "analyzing"];
                  const current = steps.indexOf(status);
                  return (
                    <div
                      key={step}
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: i <= current ? "#2C5F4A" : "#E8E2D9",
                        transition: "background-color 0.3s",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {status === "done" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <CheckCircle size={40} color="#22c55e" />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{fileName}</p>
              <p style={{ fontSize: 14, color: "#22c55e" }}>Uploaded and analyzed</p>
            </div>
          )}

          {status === "error" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <FileText size={40} color="#C4714A" />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>{fileName || "Upload error"}</p>
              <p style={{ fontSize: 14, color: "#C4714A", maxWidth: 320 }}>{errorMsg}</p>
              <button
                onClick={() => { setStatus("idle"); setErrorMsg(""); }}
                style={{
                  marginTop: 8, padding: "10px 24px", borderRadius: 20, backgroundColor: "#2C5F4A",
                  color: "#FFFFFF", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleChange}
          style={{ display: "none" }}
        />
      </div>
    </PageContainer>
  );
}
