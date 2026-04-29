/**
 * apps/mobile/app/(app)/patients/[id]/index.tsx
 * Mobile patient dashboard screen showing meds, appointments, documents, and recent symptoms.
 * Tables: reads patients, medications, appointments, documents, symptom_logs via Supabase client.
 * Auth: any authenticated user; RLS scopes results to the user's organization.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Renders patient name, medications, and appointment titles on screen. No PHI written to logs from this file.
 */
import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { ExportPDFButton } from "@/components/export/ExportPDFButton";

type Patient = { id: string; name: string; custom_diagnosis: string | null };
type MedRow = { id: string; name: string; dose: string | null; unit: string | null; frequency: string | null };
type ApptRow = { id: string; title: string | null; datetime: string | null; provider_name: string | null };
type DocRow = { id: string; title: string | null; analysis_status: string | null; uploaded_at: string | null };
type SymptomRow = { id: string; overall_severity: number | null; created_at: string | null };

export default function PatientDashboardMobile() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [patient, setPatient] = useState<Patient | null>(null);
  const [meds, setMeds] = useState<MedRow[]>([]);
  const [appts, setAppts] = useState<ApptRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const [p, m, a, d, s] = await Promise.all([
        supabase.from("patients").select("id, name, custom_diagnosis").eq("id", id).single(),
        supabase.from("medications").select("id, name, dose, unit, frequency").eq("patient_id", id).eq("is_active", true),
        supabase.from("appointments").select("id, title, datetime, provider_name").eq("patient_id", id).gte("datetime", new Date().toISOString()).order("datetime", { ascending: true }).limit(3),
        supabase.from("documents").select("id, title, analysis_status, uploaded_at").eq("patient_id", id).order("uploaded_at", { ascending: false }).limit(3),
        supabase.from("symptom_logs").select("id, overall_severity, created_at").eq("patient_id", id).order("created_at", { ascending: false }).limit(7),
      ]);
      setPatient((p.data as Patient) ?? null);
      setMeds(((m.data ?? []) as MedRow[]));
      setAppts(((a.data ?? []) as ApptRow[]));
      setDocs(((d.data ?? []) as DocRow[]));
      setSymptoms(((s.data ?? []) as SymptomRow[]));
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2C5F4A" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loading}>
        <Text style={styles.subtle}>We could not find this patient.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientDiag}>{patient.custom_diagnosis ?? "Diagnosis not recorded"}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => router.push({ pathname: "/(app)/patients/emergency-card", params: { id: patient.id } } as never)}
            accessibilityRole="button"
            accessibilityLabel="Open emergency medical card"
          >
            <Text style={styles.emergencyButtonText}>Emergency card</Text>
          </TouchableOpacity>
          <ExportPDFButton patientId={patient.id} callerRole="caregiver" />
        </View>
      </View>

      <Section title="Medications" empty="Add medications to keep track of the schedule.">
        {meds.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.rowTitle}>{m.name}</Text>
            <Text style={styles.rowSub}>
              {[m.dose, m.unit].filter(Boolean).join(" ")} · {m.frequency ?? "Schedule not set"}
            </Text>
          </View>
        ))}
      </Section>

      <Section title="Upcoming appointments" empty="No upcoming appointments. Schedule one to stay on top of care.">
        {appts.map((a) => (
          <View key={a.id} style={styles.row}>
            <Text style={styles.rowTitle}>{a.title ?? "Appointment"}</Text>
            <Text style={styles.rowSub}>
              {a.datetime ? new Date(a.datetime).toLocaleString() : "Time to be confirmed"}
            </Text>
          </View>
        ))}
      </Section>

      <Section title="Recent documents" empty="No documents yet. Upload your first one — it takes less than a minute.">
        {docs.map((d) => (
          <View key={d.id} style={styles.row}>
            <Text style={styles.rowTitle}>{d.title ?? "Untitled document"}</Text>
            <Text style={styles.rowSub}>{d.analysis_status ?? "Pending"}</Text>
          </View>
        ))}
      </Section>

      <Section title="Recent symptoms" empty="Start tracking symptoms to see trends over time.">
        {symptoms.map((s) => (
          <View key={s.id} style={styles.row}>
            <Text style={styles.rowTitle}>Severity {s.overall_severity ?? "—"}/10</Text>
            <Text style={styles.rowSub}>{s.created_at?.slice(0, 10) ?? ""}</Text>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hasChildren ? <>{children}</> : <Text style={styles.emptyText}>{empty}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA" },
  content: { padding: 16, paddingBottom: 48 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F2EA" },
  subtle: { color: "#6B6B6B", fontSize: 14 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#E8E2D9" },
  patientName: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },
  patientDiag: { marginTop: 4, fontSize: 14, color: "#6B6B6B" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: "#2C5F4A", fontWeight: "600", marginBottom: 10 },
  row: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "#E8E2D9", minHeight: 48 },
  rowTitle: { fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
  rowSub: { marginTop: 2, fontSize: 13, color: "#6B6B6B" },
  emptyText: { color: "#6B6B6B", fontSize: 14, backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#E8E2D9" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  emergencyButton: {
    backgroundColor: "#C4714A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
