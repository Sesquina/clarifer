/**
 * apps/mobile/app/(app)/provider/patients/[id].tsx
 * Provider patient detail (mobile): tabbed Overview / Symptoms /
 * Documents / Notes / Export.
 * Tables: GET /api/provider/patients/[id]; POST/DELETE notes;
 *         POST /export
 * Auth: provider role only (server enforces 403)
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: Renders full clinical PHI for one patient. Bearer token sent
 * on every request; server writes audit_log on every operation. No
 * PHI logged client-side.
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { colors, radius, spacing, touchTarget, typography } from "@/lib/design-tokens";

interface Patient {
  id: string;
  name: string | null;
  custom_diagnosis: string | null;
  condition_template_id: string | null;
}
interface SymptomLog {
  id: string;
  created_at: string | null;
  overall_severity: number | null;
}
interface Medication {
  id: string;
  name: string | null;
  dose: string | null;
  unit: string | null;
  frequency: string | null;
}
interface Appointment {
  id: string;
  title: string | null;
  datetime: string | null;
  appointment_type: string | null;
}
interface DocumentRow {
  id: string;
  title: string | null;
  summary: string | null;
}
interface AlertRow {
  id: string;
  alert_type: string | null;
  message: string | null;
}
interface Note {
  id: string;
  note_text: string;
  note_type: string | null;
  created_at: string | null;
}

interface DetailResponse {
  patient: Patient;
  symptom_logs: SymptomLog[];
  medications: Medication[];
  upcoming_appointments: Appointment[];
  recent_documents: DocumentRow[];
  active_alerts: AlertRow[];
  provider_notes: Note[];
}

type Tab = "overview" | "symptoms" | "documents" | "notes" | "export";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "symptoms", label: "Symptoms" },
  { id: "documents", label: "Docs" },
  { id: "notes", label: "Notes" },
  { id: "export", label: "Export" },
];

const NOTE_TYPES = ["general", "visit", "alert", "follow_up"];

export default function ProviderPatientDetailMobile() {
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = typeof params.id === "string" ? params.id : "";

  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/provider/patients/${patientId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setError("We could not load this patient.");
        return;
      }
      setData((await res.json()) as DetailResponse);
    } catch {
      setError("Something went wrong loading the patient.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error ?? "Patient not found."}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{data.patient.name ?? "Patient"}</Text>
      <Text style={styles.sub}>
        {data.patient.custom_diagnosis ?? data.patient.condition_template_id ?? "No diagnosis recorded"}
      </Text>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            accessibilityLabel={t.label}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "overview" && <OverviewSection data={data} />}
      {tab === "symptoms" && <SymptomsSection logs={data.symptom_logs} />}
      {tab === "documents" && <DocumentsSection documents={data.recent_documents} />}
      {tab === "notes" && (
        <NotesSection patientId={patientId} initialNotes={data.provider_notes} />
      )}
      {tab === "export" && <ExportSection patientId={patientId} />}
    </ScrollView>
  );
}

function OverviewSection({ data }: { data: DetailResponse }) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Active medications</Text>
        {data.medications.length === 0 ? (
          <Text style={styles.muted}>No active medications on file.</Text>
        ) : (
          data.medications.map((m) => (
            <Text key={m.id} style={styles.body}>
              {m.name ?? "Unnamed"}
              {m.dose ? ` -- ${m.dose}${m.unit ?? ""}` : ""}
              {m.frequency ? ` (${m.frequency})` : ""}
            </Text>
          ))
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Active alerts</Text>
        {data.active_alerts.length === 0 ? (
          <Text style={styles.muted}>No active alerts.</Text>
        ) : (
          data.active_alerts.map((a) => (
            <Text key={a.id} style={styles.bodyAccent}>
              {a.alert_type ?? "Alert"}
              {a.message ? ` -- ${a.message}` : ""}
            </Text>
          ))
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Upcoming appointments</Text>
        {data.upcoming_appointments.length === 0 ? (
          <Text style={styles.muted}>No upcoming appointments scheduled.</Text>
        ) : (
          data.upcoming_appointments.map((a) => (
            <Text key={a.id} style={styles.body}>
              {a.title ?? "Appointment"}
              {a.datetime ? ` -- ${new Date(a.datetime).toLocaleString()}` : ""}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

function SymptomsSection({ logs }: { logs: SymptomLog[] }) {
  if (logs.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.muted}>No symptom logs in the last 30 days.</Text>
      </View>
    );
  }
  const max = Math.max(10, ...logs.map((l) => l.overall_severity ?? 0));
  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>Severity (last 30 days)</Text>
      <View style={styles.barRow}>
        {logs.map((l) => {
          const heightPct = ((l.overall_severity ?? 0) / max) * 100;
          return (
            <View
              key={l.id}
              style={[styles.bar, { height: heightPct }]}
              accessibilityLabel={`severity ${l.overall_severity ?? 0}`}
            />
          );
        })}
      </View>
    </View>
  );
}

function DocumentsSection({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.muted}>No documents uploaded for this patient.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {documents.map((d) => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.cardHeading}>{d.title ?? "Document"}</Text>
          {d.summary && <Text style={styles.body}>{d.summary}</Text>}
        </View>
      ))}
    </View>
  );
}

function NotesSection({
  patientId,
  initialNotes,
}: {
  patientId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [text, setText] = useState("");
  const [type, setType] = useState("general");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/provider/patients/${patientId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ note_text: text.trim(), note_type: type }),
      });
      if (!res.ok) {
        Alert.alert("", "We could not save the note.");
        return;
      }
      const body = (await res.json()) as { note: Note };
      setNotes((prev) => [body.note, ...prev]);
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Add note</Text>
        <View style={styles.typeRow}>
          {NOTE_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, type === t && styles.typePillActive]}
              onPress={() => setType(t)}
              accessibilityLabel={`type ${t}`}
            >
              <Text style={[styles.typePillText, type === t && styles.typePillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Private clinical note for your records"
          placeholderTextColor={colors.muted}
          accessibilityLabel="note text"
        />
        <TouchableOpacity
          style={[styles.saveButton, (saving || !text.trim()) && styles.saveButtonDisabled]}
          onPress={add}
          disabled={saving || !text.trim()}
          accessibilityLabel="save note"
        >
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save note"}</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <Text style={styles.muted}>No notes yet for this patient.</Text>
      ) : (
        notes.map((n) => (
          <View key={n.id} style={styles.card}>
            <Text style={styles.typeBadge}>{n.note_type ?? "general"}</Text>
            <Text style={styles.body}>{n.note_text}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function ExportSection({ patientId }: { patientId: string }) {
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/provider/patients/${patientId}/export`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        Alert.alert("", "We could not generate the report.");
        return;
      }
      // Native share sheet for the PDF blob is wired in the native share
      // sprint; for now confirm success and rely on the web download path.
      Alert.alert("PDF ready", "The clinical report has been generated.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>Generate clinical PDF report</Text>
      <Text style={styles.muted}>
        Includes patient demographics, active medications, last 30 days of symptom severity,
        recent documents, upcoming appointments, and biomarkers.
      </Text>
      <TouchableOpacity
        style={[styles.saveButton, styles.exportButton, generating && styles.saveButtonDisabled]}
        onPress={generate}
        disabled={generating}
        accessibilityLabel="generate pdf report"
      >
        <Text style={styles.saveButtonText}>{generating ? "Generating..." : "Generate PDF report"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  heading: {
    fontSize: typography.sizeTitle,
    fontWeight: typography.weightSemibold,
    color: colors.primary,
  },
  sub: { color: colors.muted, fontSize: 13, marginBottom: spacing.md },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontSize: 13, fontWeight: typography.weightSemibold },
  tabTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardHeading: { color: colors.primary, fontSize: 16, fontWeight: typography.weightSemibold, marginBottom: spacing.xs },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  bodyAccent: { color: colors.accent, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  errorBanner: {
    margin: spacing.lg,
    backgroundColor: colors.paleTerra,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
  },
  errorText: { color: colors.text, fontSize: 14 },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 100,
    overflow: "hidden",
  },
  bar: { width: 6, backgroundColor: colors.primary, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  textArea: {
    minHeight: 96,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    color: colors.text,
    fontSize: typography.sizeBody,
    textAlignVertical: "top",
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  typePill: {
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  typePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typePillText: { color: colors.text, fontSize: 13 },
  typePillTextActive: { color: colors.white },
  typeBadge: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: typography.weightSemibold,
    backgroundColor: colors.paleSage,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  saveButton: {
    minHeight: touchTarget.minimum,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  exportButton: { backgroundColor: colors.accent },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: typography.weightSemibold },
});
