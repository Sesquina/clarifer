/**
 * apps/mobile/app/(app)/provider/index.tsx
 * Provider portal home (mobile): patient list with alert badges.
 * Tables: GET /api/provider/patients (no direct Supabase)
 * Auth: provider role only (server enforces 403)
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Renders patient names + diagnoses. Bearer token sent on
 * every request; server writes audit_log on read. No PHI in logs.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { colors, radius, spacing, touchTarget, typography } from "@/lib/design-tokens";

interface PatientCard {
  id: string;
  name: string | null;
  custom_diagnosis: string | null;
  condition_template_id: string | null;
  last_symptom_log_at: string | null;
  next_appointment_at: string | null;
  medication_count: number;
  active_alert_count: number;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

const COPY = {
  title: "My Patients",
  searchPlaceholder: "Search patients by name",
  loadError: "We could not load your patients. Try again in a moment.",
  empty:
    "No patients assigned yet. Contact your administrator to be assigned to patient care teams.",
  alerts: "active alerts",
} as const;

export default function ProviderHomeMobile() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/provider/patients`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setError(COPY.loadError);
        setPatients([]);
        return;
      }
      const json = (await res.json()) as { patients: PatientCard[] };
      setPatients(json.patients ?? []);
    } catch {
      setError(COPY.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  }, [patients, query]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{COPY.title}</Text>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={COPY.searchPlaceholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={COPY.searchPlaceholder}
      />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState} accessibilityLabel="empty-state">
          <Text style={styles.emptyText}>{COPY.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(app)/provider/patients/${item.id}`)}
              accessibilityLabel={`Open patient ${item.name ?? "Unnamed"}`}
            >
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.name ?? "Unnamed"}</Text>
                {item.active_alert_count > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>
                      {item.active_alert_count} {COPY.alerts}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSub}>
                {item.custom_diagnosis ?? item.condition_template_id ?? "No diagnosis recorded"}
              </Text>
              <Text style={styles.cardMeta}>
                {item.last_symptom_log_at ? "Recent symptom log" : "No recent activity"}
                {" · "}
                {item.medication_count} med{item.medication_count === 1 ? "" : "s"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  heading: {
    fontSize: typography.sizeHero,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  search: {
    minHeight: touchTarget.minimum,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.sizeBody,
    marginBottom: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.paleTerra,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.text, fontSize: 14 },
  loadingBox: { paddingVertical: spacing.xl, alignItems: "center" },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: touchTarget.minimum,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: typography.weightSemibold, color: colors.text, flexShrink: 1 },
  cardSub: { fontSize: 13, color: colors.muted, marginBottom: 2 },
  cardMeta: { fontSize: 12, color: colors.muted },
  alertBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  alertBadgeText: { color: colors.white, fontSize: 11, fontWeight: typography.weightSemibold },
});
