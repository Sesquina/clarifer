import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

type Med = { id: string; name: string; dose: string | null; unit: string | null; frequency: string | null };

export default function MedicationsIndex() {
  const [meds, setMeds] = useState<Med[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("medications")
        .select("id, name, dose, unit, frequency")
        .eq("is_active", true)
        .order("name", { ascending: true });
      setMeds(((data ?? []) as Med[]));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Medications</Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/medications/new")}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2C5F4A" />
      ) : meds.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No medications added yet</Text>
          <Text style={styles.emptyBody}>Add medications to keep track of the schedule.</Text>
        </View>
      ) : (
        meds.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.medName}>{m.name}</Text>
            <Text style={styles.medMeta}>
              {[m.dose, m.unit].filter(Boolean).join(" ")} · {m.frequency ?? "Schedule not set"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA" },
  content: { padding: 16, paddingBottom: 48 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, color: "#2C5F4A", fontWeight: "700" },
  addButton: { backgroundColor: "#2C5F4A", paddingHorizontal: 16, borderRadius: 12, minHeight: 48, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "600" },
  empty: { backgroundColor: "#FFFFFF", padding: 24, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E8E2D9" },
  emptyTitle: { fontSize: 16, color: "#2C5F4A", fontWeight: "600" },
  emptyBody: { marginTop: 6, fontSize: 14, color: "#6B6B6B", textAlign: "center" },
  row: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "#E8E2D9", minHeight: 48 },
  medName: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  medMeta: { marginTop: 4, fontSize: 13, color: "#6B6B6B" },
});
