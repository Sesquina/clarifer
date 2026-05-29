/**
 * apps/mobile/app/(app)/log/index.tsx
 * Symptom log list screen — shows recent entries for the current patient, newest first.
 * Tables: reads patients (resolves patient_id from auth user), symptom_logs
 * Auth: Authenticated caregiver; RLS scopes results to organization.
 * HIPAA: Renders symptom severity and notes on screen. No PHI written from this file.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

const COLORS = {
  primary: "#2C5F4A",
  accent: "#C4714A",
  background: "#F7F2EA",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  card: "#FFFFFF",
  border: "#E8E2D9",
};

// Severity dot colors keyed by 1-5 value.
const SEVERITY_DOT: Record<number, string> = {
  1: "#90CAF9", // very mild - blue
  2: "#FFF176", // mild - yellow
  3: "#FFCC80", // moderate - orange
  4: "#EF9A9A", // significant - red-light
  5: "#E57373", // severe - red-dark
};

type SymptomLog = {
  id: string;
  overall_severity: number | null;
  notes: string | null;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SymptomLogIndex() {
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", user.id)
        .limit(1)
        .single();

      if (!patient) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("symptom_logs")
        .select("id, overall_severity, notes, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setLogs((data ?? []) as SymptomLog[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Symptom Log</Text>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No symptoms logged yet. Tap + to add your first entry.
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        SEVERITY_DOT[item.overall_severity ?? 1] ?? COLORS.muted,
                    },
                  ]}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.dateText}>
                    {formatDate(item.created_at)}
                  </Text>
                  {item.notes ? (
                    <Text style={styles.notesPreview} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => (router.push as (href: string) => void)("/(app)/log/add")}
        accessibilityLabel="Add symptom entry"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    margin: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 3, flexShrink: 0 },
  cardBody: { flex: 1 },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  notesPreview: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabIcon: { fontSize: 28, color: COLORS.card, lineHeight: 32 },
});
