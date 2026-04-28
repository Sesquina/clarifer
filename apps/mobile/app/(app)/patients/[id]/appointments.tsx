/**
 * apps/mobile/app/(app)/patients/[id]/appointments.tsx
 * Appointments mobile screen: list + create.
 * Tables: GET /api/appointments, POST /api/appointments;
 *         no direct Supabase reads.
 * Auth: server enforces (caregiver/patient/provider/admin for read,
 *       caregiver/admin for write).
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: All requests carry the Supabase access token; the server
 * writes audit_log on SELECT/INSERT and enforces org isolation. Phone
 * tap opens dialer via Linking; no PHI in logs.
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { colors, radius, spacing, touchTarget, typography } from "@/lib/design-tokens";

interface Appointment {
  id: string;
  title: string | null;
  datetime: string | null;
  provider_name: string | null;
  provider_specialty: string | null;
  location: string | null;
  appointment_type: string | null;
  completed: boolean | null;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

const COPY = {
  title: "Appointments",
  add: "Add appointment",
  empty:
    "No appointments yet. Add one when you have the next visit on the calendar -- a checklist will show up automatically.",
  loadError: "We could not load appointments. Try again in a moment.",
  saveError: "We could not save this appointment. Please try again.",
  required: "Please give the appointment a title before saving.",
  saving: "Saving...",
  save: "Save",
  cancel: "Cancel",
  upcomingHeading: "Upcoming",
  pastHeading: "Past",
} as const;

export default function MobileAppointmentsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = typeof params.id === "string" ? params.id : "";

  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [providerName, setProviderName] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${API_BASE}/api/appointments?patient_id=${encodeURIComponent(patientId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) {
        setError(COPY.loadError);
        setItems([]);
      } else {
        const json = (await res.json()) as { appointments: Appointment[] };
        setItems(json.appointments ?? []);
      }
    } catch {
      setError(COPY.loadError);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setTitle("");
    setDatetime("");
    setProviderName("");
    setAppointmentType("");
  }

  async function submit() {
    if (!title.trim()) {
      Alert.alert("", COPY.required);
      return;
    }
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const isoDatetime = parseDatetime(datetime);
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_id: patientId,
          title: title.trim(),
          datetime: isoDatetime,
          provider_name: providerName.trim() || null,
          appointment_type: appointmentType.trim() || null,
        }),
      });
      if (!res.ok) {
        Alert.alert("", COPY.saveError);
        return;
      }
      resetForm();
      setShowForm(false);
      await load();
    } catch {
      Alert.alert("", COPY.saveError);
    } finally {
      setSaving(false);
    }
  }

  const now = Date.now();
  const upcoming = items.filter((a) => {
    if (!a.datetime) return true;
    const t = new Date(a.datetime).getTime();
    return Number.isFinite(t) ? t >= now : true;
  });
  const past = items.filter((a) => {
    if (!a.datetime) return false;
    const t = new Date(a.datetime).getTime();
    return Number.isFinite(t) && t < now;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>{COPY.title}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm((v) => !v)}
          accessibilityLabel={COPY.add}
        >
          <Text style={styles.addButtonText}>{showForm ? COPY.cancel : COPY.add}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Appointment title"
            placeholderTextColor={colors.muted}
            accessibilityLabel="title"
          />
          <TextInput
            style={styles.input}
            value={datetime}
            onChangeText={setDatetime}
            placeholder="Date and time (e.g. 2026-05-15 10:30)"
            placeholderTextColor={colors.muted}
            accessibilityLabel="datetime"
          />
          <TextInput
            style={styles.input}
            value={providerName}
            onChangeText={setProviderName}
            placeholder="Provider name"
            placeholderTextColor={colors.muted}
            accessibilityLabel="provider"
          />
          <TextInput
            style={styles.input}
            value={appointmentType}
            onChangeText={setAppointmentType}
            placeholder="Type (oncology, neurology, ...)"
            placeholderTextColor={colors.muted}
            accessibilityLabel="type"
          />
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={submit}
            disabled={saving}
            accessibilityLabel={COPY.save}
          >
            <Text style={styles.saveButtonText}>{saving ? COPY.saving : COPY.save}</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState} accessibilityLabel="empty-state">
          <Text style={styles.emptyText}>{COPY.empty}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionHeading}>{COPY.upcomingHeading}</Text>
          {upcoming.length === 0 ? (
            <Text style={styles.subtleText}>No upcoming appointments.</Text>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={upcoming}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => <AppointmentCard appt={item} />}
            />
          )}
          {past.length > 0 && (
            <>
              <Text style={styles.sectionHeading}>{COPY.pastHeading}</Text>
              <FlatList
                scrollEnabled={false}
                data={past}
                keyExtractor={(a) => a.id}
                renderItem={({ item }) => <AppointmentCard appt={item} past />}
              />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function AppointmentCard({ appt, past }: { appt: Appointment; past?: boolean }) {
  const dt = appt.datetime ? new Date(appt.datetime) : null;
  const dtLabel = dt
    ? dt.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date to be confirmed";
  return (
    <View style={[styles.card, past && styles.cardPast]}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>{appt.title ?? "Untitled"}</Text>
        {appt.appointment_type && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{appt.appointment_type}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardSubtitle}>{dtLabel}</Text>
      {appt.provider_name && (
        <Text style={styles.cardSubtitle}>
          {appt.provider_name}
          {appt.provider_specialty ? ` -- ${appt.provider_specialty}` : ""}
        </Text>
      )}
      {appt.location && <Text style={styles.cardSubtitle}>{appt.location}</Text>}
    </View>
  );
}

/**
 * Best-effort parse of "YYYY-MM-DD HH:mm" or full ISO. Returns ISO
 * string or null. Mobile native datetime pickers ship in a future
 * sprint; this keeps the create flow usable today.
 */
function parseDatetime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.sizeTitle,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  addButton: {
    minHeight: touchTarget.minimum,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    justifyContent: "center",
  },
  addButtonText: { color: colors.white, fontWeight: typography.weightSemibold, fontSize: 14 },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    minHeight: touchTarget.minimum,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.sizeBody,
  },
  saveButton: {
    minHeight: touchTarget.minimum,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: colors.white, fontWeight: typography.weightSemibold, fontSize: 14 },
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
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  sectionHeading: {
    fontSize: typography.sizeLabel,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  subtleText: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardPast: { opacity: 0.7 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: 16, fontWeight: typography.weightSemibold, color: colors.text },
  typeBadge: {
    backgroundColor: colors.paleSage,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  typeBadgeText: { color: colors.primary, fontSize: 11, fontWeight: typography.weightSemibold },
  cardSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
