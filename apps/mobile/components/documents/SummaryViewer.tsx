import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";

interface Props {
  content: string | null;
  status: "pending" | "completed" | "failed";
  onAnalyze?: () => void;
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

function parseSections(text: string) {
  const headings = ["KEY FINDINGS", "MEDICATIONS MENTIONED", "NEXT STEPS", "QUESTIONS TO ASK"];
  const result: Array<{ title: string; body: string }> = [];
  let remaining = text;
  for (const heading of headings) {
    const idx = remaining.indexOf(heading);
    if (idx === -1) continue;
    const afterHeading = remaining.slice(idx + heading.length);
    const nextIdx = headings.reduce((min, h) => {
      const i = afterHeading.indexOf(h);
      return i !== -1 && i < min ? i : min;
    }, afterHeading.length);
    result.push({ title: heading, body: afterHeading.slice(0, nextIdx).replace(/^[\s:–-]+/, "").trim() });
    remaining = afterHeading.slice(nextIdx);
  }
  return result.length > 0 ? result : [{ title: "Summary", body: text.trim() }];
}

export function SummaryViewer({ content, status }: Props) {
  if (status === "pending") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2C5F4A" />
        <Text style={styles.pendingText}>Analyzing document…</Text>
      </View>
    );
  }

  if (status === "failed" || !content) {
    return <Text style={styles.error}>Analysis not available.</Text>;
  }

  const sections = parseSections(content);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {sections.map((s) => <Section key={s.title} title={s.title} body={s.body} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  center: { alignItems: "center", paddingVertical: 32 },
  pendingText: { color: "#888", marginTop: 12, fontSize: 14 },
  error: { color: "#C0392B", fontSize: 14, textAlign: "center", padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#2C5F4A", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionBody: { fontSize: 15, color: "#333", lineHeight: 22 },
});
