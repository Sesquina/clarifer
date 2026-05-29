/**
 * apps/mobile/app/(app)/patients/[id]/index.tsx
 * Patient hub screen: greeting, stat cards, next appointment, quick links to sub-screens.
 * Tables: patients, symptom_logs (count), medications (count), appointments (next 1)
 * Auth: any authenticated user; RLS scopes results to the user's organization.
 * HIPAA: Renders patient first name only. No diagnosis, no condition names, no PHI in logs.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { colors, radius, spacing, touchTarget } from "@/lib/design-tokens";

type ApptRow = {
  id: string;
  title: string | null;
  datetime: string | null;
  provider_name: string | null;
};

export default function PatientHubScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = typeof params.id === "string" ? params.id : "";

  const [firstName, setFirstName] = useState<string | null>(null);
  const [nextAppt, setNextAppt] = useState<ApptRow | null>(null);
  const [symptomCount, setSymptomCount] = useState<number>(0);
  const [medCount, setMedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function load() {
    setLoading(true);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [patientRes, apptRes, symptomRes, medRes] = await Promise.all([
      supabase
        .from("patients")
        .select("name")
        .eq("id", patientId)
        .single(),
      supabase
        .from("appointments")
        .select("id, title, datetime, provider_name")
        .eq("patient_id", patientId)
        .gte("datetime", new Date().toISOString())
        .order("datetime", { ascending: true })
        .limit(1),
      supabase
        .from("symptom_logs")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patientId)
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("medications")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patientId)
        .eq("is_active", true),
    ]);

    if (patientRes.data?.name) {
      setFirstName((patientRes.data.name as string).split(" ")[0]);
    }
    setNextAppt(((apptRes.data ?? [])[0] ?? null) as ApptRow | null);
    setSymptomCount(symptomRes.count ?? 0);
    setMedCount(medRes.count ?? 0);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!firstName) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>We could not find this patient.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Caring for {firstName}</Text>

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{symptomCount}</Text>
          <Text style={styles.statLabel}>Symptoms this month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{medCount}</Text>
          <Text style={styles.statLabel}>Active medications</Text>
        </View>
      </View>

      {/* Next appointment */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Next appointment</Text>
        {nextAppt ? (
          <>
            <Text style={styles.cardTitle}>{nextAppt.title ?? "Appointment"}</Text>
            <Text style={styles.cardSub}>
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

      {/* Quick links */}
      <Text style={styles.sectionHeading}>Quick access</Text>
      <View style={styles.tileGrid}>
        <QuickLink
          label="Appointments"
          icon="📅"
          onPress={() =>
            router.push({
              pathname: "/(app)/patients/[id]/appointments",
              params: { id: patientId },
            } as never)
          }
        />
        <QuickLink
          label="Family update"
          icon="📨"
          onPress={() =>
            router.push({
              pathname: "/(app)/patients/[id]/family-update",
              params: { id: patientId },
            } as never)
          }
        />
        <QuickLink
          label="Care team"
          icon="👥"
          onPress={() =>
            router.push({
              pathname: "/(app)/patients/[id]/care-team",
              params: { id: patientId },
            } as never)
          }
        />
        <QuickLink
          label="Clinical trials"
          icon="🔬"
          onPress={() =>
            router.push({
              pathname: "/(app)/patients/[id]/trials",
              params: { id: patientId },
            } as never)
          }
        />
      </View>

      {/* Emergency card */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() =>
          router.push({
            pathname: "/(app)/patients/emergency-card",
            params: { id: patientId },
          } as never)
        }
        accessibilityRole="button"
        accessibilityLabel="Open emergency medical card"
      >
        <Text style={styles.emergencyButtonText}>Emergency card</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function QuickLink({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    minHeight: 72,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  cardSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  tile: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: radius.tile,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchTarget.minimum + 24,
    justifyContent: "center",
  },
  tileIcon: { fontSize: 26, marginBottom: spacing.sm },
  tileLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  emergencyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    minHeight: touchTarget.minimum,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emergencyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: { fontSize: 14, color: colors.muted },
});
