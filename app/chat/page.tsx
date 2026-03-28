"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInput } from "@/components/chat/chat-input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", user.id)
        .limit(1)
        .single();

      if (!patient) return;
      setPatientId(patient.id);

      const { data: history } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (history) {
        setMessages(history.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          created_at: m.created_at,
        })));
      }
    }
    load();
  }, [supabase]);

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
          patientId,
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
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                const captured = assistantContent;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: captured } : m))
                );
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
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

  const handleFileUpload = useCallback(async (file: File) => {
    if (!patientId || !userId) return;

    const timestamp = Date.now();
    const path = `${userId}/${patientId}/${timestamp}_${file.name}`;

    // Show uploading message in chat
    const docMsgId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: docMsgId,
        role: "user",
        content: `📎 Uploading ${file.name}...`,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file);

      if (uploadError) {
        setMessages((prev) =>
          prev.map((m) => m.id === docMsgId ? { ...m, content: `❌ Upload failed: ${uploadError.message}` } : m)
        );
        return;
      }

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 3600);

      const fileUrl = urlData?.signedUrl || "";

      // Determine file type and category
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const category = ["pdf"].includes(ext) ? "lab_result" : "other";

      // Insert document record
      const { data: doc, error: insertError } = await supabase
        .from("documents")
        .insert({
          patient_id: patientId,
          uploaded_by: userId,
          file_url: fileUrl,
          file_type: ext,
          title: file.name,
          document_category: category,
        })
        .select()
        .single();

      if (insertError || !doc) {
        setMessages((prev) =>
          prev.map((m) => m.id === docMsgId ? { ...m, content: `❌ Failed to save document: ${insertError?.message}` } : m)
        );
        return;
      }

      // Update message to show uploaded
      setMessages((prev) =>
        prev.map((m) => m.id === docMsgId ? { ...m, content: `📎 ${file.name} — Uploaded. Analyzing...` } : m)
      );

      // Read file content for text-based files
      let fileContent = "";
      if (["txt", "csv", "md"].includes(ext)) {
        fileContent = await file.text();
      } else {
        fileContent = `[${ext.toUpperCase()} file: ${file.name}, ${(file.size / 1024).toFixed(1)}KB]`;
      }

      // Call summarize API
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, content: fileContent }),
      });

      const summaryData = await res.json();

      if (summaryData.error) {
        setMessages((prev) =>
          prev.map((m) => m.id === docMsgId ? { ...m, content: `📎 ${file.name} — Uploaded (analysis failed)` } : m)
        );
        return;
      }

      // Show AI summary as assistant message
      const findings = summaryData.keyFindings || [];
      const findingsText = findings
        .map((f: { label: string; value: string; status?: string }) =>
          `• ${f.label}: ${f.value}${f.status === "flagged" ? " ⚠️" : ""}`
        )
        .join("\n");

      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === docMsgId ? { ...m, content: `📎 ${file.name} — Uploaded & analyzed` } : m
        ),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `📋 **Document Summary: ${file.name}**\n\n${summaryData.summary || "No summary available."}\n\n${findingsText ? `**Key Findings:**\n${findingsText}` : ""}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === docMsgId ? { ...m, content: `❌ Upload failed unexpectedly` } : m)
      );
    }
  }, [patientId, userId, supabase]);

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col">
      <ChatHistory messages={messages} isLoading={isLoading} />
      <ChatInput
        onSend={handleSend}
        onFileSelect={handleFileUpload}
        disabled={isLoading || !patientId}
      />
    </div>
  );
}
