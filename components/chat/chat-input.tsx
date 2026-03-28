"use client";

import { useState, useRef } from "react";
import { Send, Paperclip } from "lucide-react";

export interface FilePayload {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileSelect?: (payload: FilePayload) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onFileSelect, disabled, placeholder = "Ask Medalyn anything..." }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onFileSelect) return;

    // Read file to base64 immediately, before any re-render can invalidate the reference
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const fileData = btoa(binary);

    onFileSelect({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      fileData,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-end gap-2 border-t p-3" style={{ backgroundColor: "#F7F2EA" }}>
      {onFileSelect && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/60 disabled:opacity-50"
            style={{ color: "#6B6B6B" }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        style={{
          border: "1.5px solid #E8E2D9",
          backgroundColor: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#2C5F4A")}
        onBlur={(e) => (e.target.style.borderColor = "#E8E2D9")}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#2C5F4A", color: "#FFFFFF" }}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
