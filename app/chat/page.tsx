/**
 * app/chat/page.tsx
 * AI chat page: streaming chat with Claude, document upload and analysis in-thread.
 * Tables: chat_messages (write via /api/chat), documents (write via /api/upload)
 * Auth: caregiver
 * HIPAA: All PHI writes routed server-side. No PHI in client logs.
 */
"use client";

import { useState, useCallback } from "react";
import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInput, type FilePayload } from "@/components/chat/chat-input";
import { usePatient } from "@/lib/hooks/use-patient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { patientId, loading: patientLoading, error: patientError } = usePatient();

  const handleSend = useCallback(async (content: string) => {
    if (!patientId) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const assistantId = crypto.randomUUID();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          patient_id: patientId,
        }),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", created_at: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        const captured = assistantContent;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: captured } : m))
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== assistantId),
        {
          id: assistantId,
          role: "assistant",
          content: "Something went wrong. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, messages]);

  const handleFileUpload = useCallback(async (payload: FilePayload) => {
    if (!patientId) return;

    const { fileName: origName, fileType: origType, fileSize, fileData, error: fileError } = payload;

    if (fileError) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fileError,
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    const docMsgId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: docMsgId,
        role: "user",
        content: `📎 Uploading ${origName}...`,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      // Step 1: Upload via JSON with base64 data (already read in ChatInput)
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: origName,
          fileType: origType,
          fileSize,
          fileData,
          patientId,
        }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: `HTTP ${uploadRes.status}` }));
        setMessages((prev) =>
          prev.map((m) => m.id === docMsgId ? { ...m, content: `❌ Upload failed: ${err.error}` } : m)
        );
        return;
      }

      const { documentId } = await uploadRes.json();

      // Step 2: Analyze document -- show pulsing state immediately
      setMessages((prev) =>
        prev.map((m) => m.id === docMsgId ? { ...m, content: `📎 ${origName}: Uploaded. Analyzing...` } : m)
      );
      setIsAnalyzing(true);

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        setIsAnalyzing(false);
        setMessages((prev) =>
          prev.map((m) => m.id === docMsgId ? { ...m, content: `📎 ${origName}: Uploaded (analysis failed: ${res.status})` } : m)
        );
        return;
      }

      const summaryData = await res.json();

      if (summaryData.error) {
        setIsAnalyzing(false);
        setMessages((prev) =>
          prev.map((m) => m.id === docMsgId ? { ...m, content: `📎 ${origName}: Uploaded (analysis error: ${summaryData.error})` } : m)
        );
        return;
      }

      // Show AI summary as assistant message, replacing the pulsing state
      const findings = summaryData.keyFindings || [];
      const findingsText = findings
        .map((f: { label: string; value: string; status?: string }) =>
          `• ${f.label}: ${f.value}${f.status === "flagged" ? " ⚠️" : ""}`
        )
        .join("\n");

      setIsAnalyzing(false);
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === docMsgId ? { ...m, content: `📎 ${origName}: Uploaded and analyzed` } : m
        ),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Document summary: ${origName}\n\n${summaryData.summary || "No summary available."}\n\n${findingsText ? `Key Findings:\n${findingsText}` : ""}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setIsAnalyzing(false);
      setMessages((prev) =>
        prev.map((m) => m.id === docMsgId ? { ...m, content: `Upload failed: ${msg}` } : m)
      );
    }
  }, [patientId]);

  if (patientLoading) {
    return <div style={{ padding: '24px', color: 'var(--muted)', fontFamily: 'DM Sans' }}>Loading...</div>;
  }
  if (patientError) {
    return <div style={{ padding: '24px', color: 'var(--muted)', fontFamily: 'DM Sans' }}>Could not load patient. Please refresh.</div>;
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 7.5rem)", paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}>
      <ChatHistory messages={messages} isLoading={isLoading} />
      <p style={{
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize: 12,
        color: "var(--muted)",
        textAlign: "center",
        padding: "4px 16px",
        margin: 0,
      }}>
        Clarifer does not diagnose. For clinical decisions, always consult your care team.
      </p>
      <ChatInput
        onSend={handleSend}
        onFileSelect={handleFileUpload}
        disabled={isLoading || !patientId}
      />
    </div>
  );
}
