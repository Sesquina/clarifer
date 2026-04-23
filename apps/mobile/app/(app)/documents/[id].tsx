import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { SummaryViewer } from "@/components/documents/SummaryViewer";

interface Document {
  id: string;
  file_name: string;
  document_category: string;
  analysis_status: "pending" | "completed" | "failed";
  patient_id: string;
  created_at: string;
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadDocument() {
    if (!id) return;
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, document_category, analysis_status, patient_id, created_at")
      .eq("id", id)
      .single();
    setDoc(data ?? null);

    if (data?.analysis_status === "completed") {
      const { data: msg } = await supabase
        .from("chat_messages")
        .select("content")
        .eq("document_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setSummary(msg?.content ?? null);
    }
    setLoading(false);
  }

  useEffect(() => { loadDocument(); }, [id]);

  async function handleAnalyze() {
    if (!doc) return;
    setAnalyzing(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/analyze-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ documentId: doc.id, patientId: doc.patient_id }),
    });
    const text = await res.text();
    setSummary(text);
    setDoc((d) => d ? { ...d, analysis_status: "completed" } : d);
    setAnalyzing(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#2C5F4A" /></View>;
  }

  if (!doc) {
    return (
      <View style={styles.center}>
        <Text>Document not found.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{doc.file_name}</Text>
      <Text style={styles.category}>{doc.document_category}</Text>

      {doc.analysis_status !== "completed" && !summary && (
        <TouchableOpacity
          style={[styles.analyzeBtn, analyzing && styles.disabled]}
          onPress={handleAnalyze}
          disabled={analyzing}
          accessibilityLabel="Analyze document"
        >
          {analyzing
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
          }
        </TouchableOpacity>
      )}

      <SummaryViewer
        content={summary}
        status={summary ? "completed" : doc.analysis_status}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA" },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 12 },
  back: { color: "#2C5F4A", fontSize: 15 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  category: { fontSize: 13, color: "#888", textTransform: "capitalize", marginBottom: 20 },
  analyzeBtn: { backgroundColor: "#2C5F4A", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 24 },
  disabled: { opacity: 0.6 },
  analyzeBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
