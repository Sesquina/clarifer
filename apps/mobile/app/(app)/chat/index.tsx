/**
 * apps/mobile/app/(app)/chat/index.tsx
 * Mobile AI chat screen -- ask Clarifer anything about care.
 * Tables: patients (SELECT, created_by = user.id, to resolve patientId).
 * Auth: Supabase session token passed as Authorization: Bearer header on every /api/chat call.
 * HIPAA: No PHI written locally. Messages live in component state only; not persisted on device.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase-client";

// ── Design tokens (values mirror lib/design-tokens.ts; no hex in StyleSheet calls) ──
const T = {
  primary:    "#2C5F4A",
  accent:     "#C4714A",
  background: "#F7F2EA",
  text:       "#1A1A1A",
  muted:      "#6B6B6B",
  card:       "#FFFFFF",
  border:     "#E8E2D9",
  white:      "#FFFFFF",
} as const;

const TOUCH = 48; // minimum touch target px
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

// ── Suggested questions shown when conversation is empty ──────────────────────
const SUGGESTED = [
  "What does this lab result mean?",
  "How do I prepare for the next appointment?",
  "What side effects should I watch for?",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let _seq = 0;
function uid() { return String(++_seq); }

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Resolve patientId from authenticated user on mount
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", session.user.id)
        .limit(1)
        .single();
      if (data?.id) setPatientId(String(data.id));
    })();
  }, []);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsgId = uid();
    const aiMsgId = uid();

    const userMsg: Message = { id: userMsgId, role: "user", content: trimmed };

    // Optimistically add user message + empty AI placeholder
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: "assistant", content: "" },
    ]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Build history: existing messages + new user message
      const history = messages.concat(userMsg);

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          patientId,
        }),
      });

      if (!res.ok || !res.body) throw new Error("request failed");

      // Stream response text into AI message bubble
      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId ? { ...m, content: snap } : m)
        );
      }

      if (!accumulated) {
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: "Something went wrong. Please try again." }
              : m
          )
        );
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: "Something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ── 1. Message list ────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyHeading}>Ask Clarifer anything</Text>
            {SUGGESTED.map(q => (
              <TouchableOpacity
                key={q}
                style={styles.chip}
                onPress={() => send(q)}
                accessibilityRole="button"
                accessibilityLabel={q}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          messages.map(msg => <Bubble key={msg.id} msg={msg} />)
        )}
        {loading && messages.length > 0 && <Dots />}
      </ScrollView>

      {/* ── 2. Disclaimer ──────────────────────────────────────────────────── */}
      <Text style={styles.disclaimer}>
        Clarifer does not diagnose. For clinical decisions, always consult your care team.
      </Text>

      {/* ── 3. Input bar ───────────────────────────────────────────────────── */}
      <View style={styles.bar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Clarifer anything..."
          placeholderTextColor={T.muted}
          multiline
          editable={!loading}
          accessibilityLabel="Message input"
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (loading || !input.trim()) && styles.sendBtnOff,
          ]}
          onPress={() => send(input)}
          disabled={loading || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          activeOpacity={0.8}
        >
          <Text style={styles.sendBtnArrow}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

// ── Loading indicator ─────────────────────────────────────────────────────────
function Dots() {
  return (
    <View style={styles.bubbleRowAI}>
      <View style={[styles.bubble, styles.bubbleAI, styles.dotsWrap]}>
        <ActivityIndicator size="small" color={T.muted} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.background },

  // Message list
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8, gap: 4 },

  // Empty / suggested questions
  empty: { paddingTop: 48, alignItems: "center", gap: 12 },
  emptyHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: T.primary,
    marginBottom: 4,
  },
  chip: {
    width: "90%",
    minHeight: TOUCH,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: T.card,
  },
  chipText: { fontSize: 14, color: T.text, textAlign: "center" },

  // Bubbles
  bubbleRow: { flexDirection: "row", marginVertical: 4 },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAI: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: T.primary,
    borderTopRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderTopLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: T.text },
  bubbleTextUser: { color: T.white },
  dotsWrap: { minWidth: 60, alignItems: "center", justifyContent: "center" },

  // Disclaimer
  disclaimer: {
    fontSize: 12,
    color: T.muted,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  // Input bar
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.card,
  },
  textInput: {
    flex: 1,
    minHeight: TOUCH,
    maxHeight: 120,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: T.text,
    backgroundColor: T.background,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: T.border },
  sendBtnArrow: {
    fontSize: 22,
    color: T.white,
    fontWeight: "600",
    lineHeight: 26,
  },
});
