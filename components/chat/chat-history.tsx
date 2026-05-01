"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
  isAnalyzing?: boolean;
}

export function ChatHistory({ messages, isLoading, isAnalyzing }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <img src="/clarifer-logo.png" alt="Clarifer" width={32} height={32} className="rounded-full" style={{ objectFit: "contain" }} />
          </div>
          <h2 className="text-lg font-semibold">How can I help?</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Ask me about symptoms, medications, lab results, or anything related to your care.
          </p>
        </div>
      )}
      <div className="space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.created_at}
          />
        ))}
        {isAnalyzing && (
          <div className="flex gap-3">
            <img
              src="/clarifer-logo.png"
              alt="Clarifer"
              width={28}
              height={28}
              className="rounded-full shrink-0 animate-pulse"
              style={{ objectFit: "contain" }}
            />
            <div
              className="animate-pulse"
              style={{
                backgroundColor: "var(--card)",
                border: "0.5px solid var(--border)",
                borderRadius: 16,
                padding: "10px 16px",
                fontSize: 14,
                color: "var(--muted)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}
            >
              Reading your document...
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Clarifer is thinking...
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
