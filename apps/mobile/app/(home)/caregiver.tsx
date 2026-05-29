/**
 * caregiver.tsx
 * Mobile caregiver home screen: patient greeting, recent symptoms, next appointment, nav tiles, CCF card.
 * Tables: patients, symptom_logs, appointments
 * Auth: caregiver (authenticated via Supabase session)
 * HIPAA: Renders patient first name and appointment provider name on screen. No PHI written to logs.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-client";

// Design system color constants (lib/design-tokens.ts not yet created, see SPRINT_LOG DISCOVERED ISSUE)
const C = {
  background: "#F7F2EA",
  primary: "#2C5F4A",
  accent: "#C4714A",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  border: "#E8E2D9",
  paleSage: "#F0F5F2",
  paleTerra: "#FDF3EE",
} as const;

type SymptomRow = { id: string; created_at: string | null; overall_severity: number | null };
type ApptRow = { id: string; datetime: string | null; provider_name: string | null };

export default function CaregiverHomeScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [nextAppt, setNextAppt] = useState<ApptRow | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function load() {
    setLoading(true);
    const { data: patient } = await supabase
      .from("patients")
      .select("id, name")
      .eq("created_by", user!.id)
      .limit(1)
      .single();

    if (!patient) {
      setLoading(false);
      return;
    }

    setFirstName((patient.name as string).split(" ")[0]);

    const [symptomsResult, apptResult] = await Promise.all([
      supabase
        .from("symptom_logs")
        .select("id, created_at, overall_severity")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("appointments")
        .select("id, datetime, provider_name")
        .eq("patient_id", patient.id)
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true })
        .limit(1),
    ]);

    setSymptoms((symptomsResult.data ?? []) as SymptomRow[]);
    setNextAppt(((apptResult.data ?? [])[0] ?? null) as ApptRow | null);
    setLoading(false);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        {firstName ? `Caring for ${firstName}` : "Welcome back"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Next appointment</Text>
        {nextAppt ? (
          <>
            <Text style={styles.cardBody}>
              {nextAppt.datetime
                ? new Date(nextAppt.datetime).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Date to be confirmed"}
            </Text>
            {nextAppt.provider_name ? (
              <Text style={styles.cardSub}>with {nextAppt.provider_name}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.emptyText}>No upcoming appointments scheduled.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Recent symptom entries</Text>
        {symptoms.length > 0 ? (
          symptoms.map((s) => (
            <View key={s.id} style={styles.symptomRow}>
              <Text style={styles.symptomDate}>
                {s.created_at
                  ? new Date(s.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </Text>
              <Text style={styles.symptomSeverity}>
                Severity {s.overall_severity != null ? `${s.overall_severity}/10` : "not recorded"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No symptoms logged yet. Tap Log Symptom to get started.
          </Text>
        )}
      </View>

      <View style={styles.grid}>
        {/* DECISION REQUIRED: no mobile Log Symptom screen exists. Tile present, navigation pending. */}
        <TouchableOpacity
          style={styles.tile}
          accessibilityRole="button"
          accessibilityLabel="Log a symptom"
        >
          <Text style={styles.tileIcon}>📋</Text>
          <Text style={styles.tileLabel}>Log Symptom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tile}
          onPress={() => router.push("/(app)/documents" as never)}
          accessibilityRole="button"
          accessibilityLabel="View documents"
        >
          <Text style={styles.tileIcon}>📁</Text>
          <Text style={styles.tileLabel}>Documents</Text>
        </TouchableOpacity>

        {/* DECISION REQUIRED: no mobile Chat screen exists. Tile present, navigation pending. */}
        <TouchableOpacity
          style={styles.tile}
          accessibilityRole="button"
          accessibilityLabel="Open chat"
        >
          <Text style={styles.tileIcon}>💬</Text>
          <Text style={styles.tileLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tile}
          onPress={() => router.push("/(app)/medications" as never)}
          accessibilityRole="button"
          accessibilityLabel="View medications"
        >
          <Text style={styles.tileIcon}>💊</Text>
          <Text style={styles.tileLabel}>Medications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ccfCard}>
        <Text style={styles.ccfTitle}>Don't know where to start?</Text>
        <Text style={styles.ccfBody}>
          We partnered with the Clarifer Care Foundation to help families find resources, clinical trials, and support at every stage of care.
        </Text>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 24, paddingBottom: 48 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.background,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: C.primary,
    marginTop: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardBody: { fontSize: 16, fontWeight: "600", color: C.text },
  cardSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  emptyText: { fontSize: 14, color: C.muted },
  symptomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 48,
  },
  symptomDate: { fontSize: 14, color: C.muted },
  symptomSeverity: { fontSize: 14, fontWeight: "500", color: C.text },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    width: "47%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 80,
    justifyContent: "center",
  },
  tileIcon: { fontSize: 28, marginBottom: 8 },
  tileLabel: { fontSize: 14, fontWeight: "600", color: C.text, textAlign: "center" },
  ccfCard: {
    backgroundColor: C.paleTerra,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  ccfTitle: { fontSize: 15, fontWeight: "700", color: C.accent, marginBottom: 6 },
  ccfBody: { fontSize: 13, color: C.text, lineHeight: 20 },
  signOut: {
    alignItems: "center",
    paddingVertical: 16,
    minHeight: 48,
    justifyContent: "center",
  },
  signOutText: { fontSize: 14, color: C.muted },
});
