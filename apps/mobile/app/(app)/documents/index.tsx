/**
 * documents/index.tsx
 * Lists documents for the current user's patient. Real Supabase data.
 * Tables: patients (read), documents (read)
 * Auth: useAuth (session required)
 * HIPAA: No PHI in this file — document metadata only
 */
import { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";

interface Document {
  id: string;
  file_name: string;
  document_category: string;
  analysis_status: "pending" | "completed" | "failed";
  ai_summary: string | null;
  uploaded_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("created_by", user!.id)
      .limit(1)
      .single();

    if (!patient) {
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("documents")
      .select("id, file_name, document_category, analysis_status, ai_summary, uploaded_at")
      .eq("patient_id", patient.id)
      .order("uploaded_at", { ascending: false });

    if (err) setError(err.message);
    else setDocuments((data ?? []) as Document[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/(app)/documents/[id]", params: { id: item.id } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.file_name}`}
          >
            <View style={styles.row}>
              <Text style={styles.fileName} numberOfLines={2}>{item.file_name}</Text>
              {item.ai_summary != null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>AI analyzed</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{fmtDate(item.uploaded_at)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No documents yet. Upload your first document from the web app.
          </Text>
        }
      />
    </View>
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
  container: { flex: 1, backgroundColor: C.background, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: C.primary, marginBottom: 16 },
  list: { paddingTop: 8, paddingBottom: 32 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    minHeight: 64,
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  fileName: { fontSize: 15, fontWeight: "600", color: C.text, flex: 1, marginRight: 8 },
  date: { fontSize: 12, color: C.muted, marginTop: 4 },
  badge: {
    backgroundColor: C.paleSage,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  badgeText: { fontSize: 11, color: C.primary, fontWeight: "600" },
  empty: { textAlign: "center", color: C.muted, marginTop: 40, fontSize: 15, lineHeight: 22 },
  error: { color: C.accent, fontSize: 13, marginBottom: 8 },
});
