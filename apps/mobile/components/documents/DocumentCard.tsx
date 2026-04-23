import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

interface Document {
  id: string;
  file_name: string;
  document_category: string;
  analysis_status: "pending" | "completed" | "failed";
  created_at: string;
}

interface Props {
  document: Document;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#2C5F4A",
  pending: "#888",
  failed: "#C0392B",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Analyzed",
  pending: "Analyzing…",
  failed: "Analysis failed",
};

export function DocumentCard({ document: doc }: Props) {
  const statusColor = STATUS_COLORS[doc.analysis_status] ?? "#888";
  const statusLabel = STATUS_LABELS[doc.analysis_status] ?? doc.analysis_status;
  const date = new Date(doc.created_at).toLocaleDateString();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/documents/${doc.id}`)}
      accessibilityLabel={`Document ${doc.file_name}`}
    >
      <View style={styles.row}>
        <Text style={styles.icon}>📄</Text>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{doc.file_name}</Text>
          <Text style={styles.category}>{doc.document_category}</Text>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  category: { fontSize: 12, color: "#666", marginTop: 2, textTransform: "capitalize" },
  status: { fontSize: 12, marginTop: 4, fontWeight: "500" },
  date: { fontSize: 11, color: "#aaa", marginLeft: 8 },
});
