import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { UploadButton } from "@/components/documents/UploadButton";

interface Document {
  id: string;
  file_name: string;
  document_category: string;
  analysis_status: "pending" | "completed" | "failed";
  created_at: string;
}

export default function DocumentsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDocuments() {
    if (!patientId) { setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("documents")
      .select("id, file_name, document_category, analysis_status, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setDocuments(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadDocuments(); }, [patientId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2C5F4A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      {patientId && (
        <UploadButton
          patientId={patientId}
          onUploaded={loadDocuments}
        />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DocumentCard document={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No documents yet. Upload the first one.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#2C5F4A", marginBottom: 16 },
  list: { paddingTop: 16, paddingBottom: 32 },
  empty: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 15 },
  error: { color: "#C0392B", fontSize: 13, marginBottom: 8 },
});
