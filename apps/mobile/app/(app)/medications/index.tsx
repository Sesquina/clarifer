/**
 * medications/index.tsx
 * Medication list for the current user's patient. Includes mark-as-taken.
 * Tables: patients (read), medications (read, update last_taken)
 * Auth: useAuth (session required)
 * HIPAA: No PHI beyond medication names visible to the user
 */
import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";

type Med = {
  id: string;
  name: string;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
  last_taken: string | null;
};

export default function MedicationsIndex() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);

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

    const { data } = await supabase
      .from("medications")
      .select("id, name, dose, unit, frequency, last_taken")
      .eq("patient_id", patient.id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    setMeds((data ?? []) as Med[]);
    setLoading(false);
  }

  async function handleMarkTaken(medId: string, previousTaken: string | null) {
    const now = new Date().toISOString();
    // Optimistic update — mark immediately
    setMeds((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, last_taken: now } : m))
    );

    const { error } = await supabase
      .from("medications")
      .update({ last_taken: now })
      .eq("id", medId);

    if (error) {
      // Revert to previous value on failure
      setMeds((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, last_taken: previousTaken } : m))
      );
    }
  }

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
        <ActivityIndicator color={C.primary} />
      ) : meds.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No medications added yet</Text>
          <Text style={styles.emptyBody}>
            Add medications to keep track of the schedule.
          </Text>
        </View>
      ) : (
        meds.map((m) => (
          <View key={m.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.medName}>{m.name}</Text>
              <Text style={styles.medMeta}>
                {[m.dose, m.unit].filter(Boolean).join(" ")}
                {m.frequency ? ` · ${m.frequency}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkBtn, m.last_taken !== null && styles.checkBtnActive]}
              onPress={() => handleMarkTaken(m.id, m.last_taken)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: m.last_taken !== null }}
              accessibilityLabel={`Mark ${m.name} as taken`}
            >
              <Text
                style={[
                  styles.checkMark,
                  m.last_taken !== null && styles.checkMarkActive,
                ]}
              >
                {m.last_taken !== null ? "✓" : "○"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const C = {
  primary: "#2C5F4A",
  background: "#F7F2EA",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  border: "#E8E2D9",
  paleSage: "#F0F5F2",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 48 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, color: C.primary, fontWeight: "700" },
  addButton: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "600" },
  empty: {
    backgroundColor: C.card,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyTitle: { fontSize: 16, color: C.primary, fontWeight: "600" },
  emptyBody: { marginTop: 6, fontSize: 14, color: C.muted, textAlign: "center" },
  row: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
  },
  rowMain: { flex: 1 },
  medName: { fontSize: 16, fontWeight: "600", color: C.text },
  medMeta: { marginTop: 4, fontSize: 13, color: C.muted },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkBtnActive: { borderColor: C.primary, backgroundColor: C.paleSage },
  checkMark: { fontSize: 18, color: C.muted },
  checkMarkActive: { color: C.primary },
});
