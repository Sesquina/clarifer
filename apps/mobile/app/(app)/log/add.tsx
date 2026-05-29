/**
 * apps/mobile/app/(app)/log/add.tsx
 * Add symptom entry form — simplified mobile version of the web symptom log.
 * Tables: reads patients (resolves patient_id); writes symptom_logs
 * Auth: Authenticated caregiver; RLS scopes writes to organization.
 * HIPAA: Writes PHI (severity, notes) directly via Supabase client.
 *   No audit_log entry is made on this path -- the web route /api/log/create
 *   handles audit_log for web. Mobile audit coverage is a known gap.
 *   Logged as DISCOVERED ISSUE in SPRINT_LOG.md.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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

const SEVERITY_CHIPS = [
  { value: 1, label: "Very mild", bg: "#E3F2FD", fg: "#0D3B6E" },
  { value: 2, label: "Mild", bg: "#FEF8E1", fg: "#7A4F00" },
  { value: 3, label: "Moderate", bg: "#FEF0E1", fg: "#7A3B00" },
  { value: 4, label: "Significant", bg: "#FDECEA", fg: "#8B1A1A" },
  { value: 5, label: "Severe", bg: "#F5E0DE", fg: "#5C0F0F" },
] as const;

export default function AddSymptomLog() {
  const [severity, setSeverity] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatient() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", user.id)
        .limit(1)
        .single();
      if (patient) setPatientId(patient.id);
    }
    loadPatient();
  }, []);

  async function handleSave() {
    if (!severity || !patientId) return;
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("symptom_logs").insert({
      patient_id: patientId,
      overall_severity: severity,
      notes: notes.trim() || null,
      created_at: new Date().toISOString(),
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.back();
    }
  }

  const canSave = severity !== null && patientId !== null && !saving;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>How are they doing today?</Text>

      {/* Severity selector */}
      <Text style={styles.sectionLabel}>Overall level *</Text>
      <View style={styles.chipsContainer}>
        {SEVERITY_CHIPS.map((chip) => {
          const selected = severity === chip.value;
          return (
            <TouchableOpacity
              key={chip.value}
              onPress={() => setSeverity(selected ? null : chip.value)}
              style={[
                styles.chip,
                { backgroundColor: chip.bg, borderColor: selected ? chip.fg : COLORS.border },
                selected && styles.chipSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, { color: chip.fg }]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notes */}
      <Text style={styles.sectionLabel}>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="What are you noticing today?"
        placeholderTextColor={COLORS.muted}
        multiline
        numberOfLines={4}
        style={styles.notesInput}
        textAlignVertical="top"
      />

      {/* Inline error */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.submitButton, !canSave && styles.submitButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Save log"
      >
        {saving ? (
          <ActivityIndicator color={COLORS.card} />
        ) : (
          <Text style={styles.submitText}>Save log</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  chipsContainer: { flexDirection: "column", gap: 8, marginBottom: 20 },
  chip: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  chipSelected: { borderWidth: 2 },
  chipText: { fontSize: 15, fontWeight: "500" },
  notesInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: 24,
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  submitButtonDisabled: { backgroundColor: COLORS.border },
  submitText: { fontSize: 16, fontWeight: "600", color: COLORS.card },
});
