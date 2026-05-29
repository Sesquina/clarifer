/**
 * documents/[id].tsx
 * Document detail view with ai_summary from the documents table.
 * Tables: documents (read)
 * Auth: session required (screen is inside (app) layout)
 * HIPAA: Displays document metadata and AI-generated summary — no raw PHI
 */
import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

interface Document {
  id: string;
  file_name: string;
  document_category: string;
  analysis_status: "pending" | "completed" | "failed";
  patient_id: string;
  ai_summary: string | null;
  uploaded_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, document_category, analysis_status, patient_id, ai_summary, uploaded_at")
      .eq("id", id)
      .single();
    setDoc(data ?? null);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (!doc) {
    return (
      <View style={styles.center}>
        <Text style={{ color: C.text }}>Document not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{doc.file_name}</Text>
      {doc.document_category ? (
        <Text style={styles.category}>{doc.document_category}</Text>
      ) : null}
      <Text style={styles.date}>{fmtDate(doc.uploaded_at)}</Text>

      {doc.ai_summary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>AI Summary</Text>
          <Text style={styles.summaryText}>{doc.ai_summary}</Text>
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingTitle}>Analysis pending</Text>
          <Text style={styles.pendingBody}>
            The AI summary will appear here once your document has been processed.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const C = {
  primary: "#2C5F4A",
  accent: "#C4714A",
  background: "#F7F2EA",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  border: "#E8E2D9",
  paleSage: "#F0F5F2",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  backBtn: { marginBottom: 16, minHeight: 48, justifyContent: "center" },
  back: { color: C.primary, fontSize: 15, fontWeight: "500" },
  title: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 4 },
  category: { fontSize: 13, color: C.muted, textTransform: "capitalize", marginBottom: 4 },
  date: { fontSize: 13, color: C.muted, marginBottom: 20 },
  summaryCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryText: { fontSize: 15, color: C.text, lineHeight: 22 },
  pendingCard: {
    backgroundColor: C.paleSage,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  pendingTitle: { fontSize: 15, fontWeight: "600", color: C.primary, marginBottom: 6 },
  pendingBody: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
});
