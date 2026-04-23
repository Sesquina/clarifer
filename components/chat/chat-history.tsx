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
}

export function ChatHistory({ messages, isLoading }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-lg font-bold text-primary">M</span>
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
