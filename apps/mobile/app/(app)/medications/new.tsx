/**
 * medications/new.tsx
 * Add medication form. Patient is auto-resolved from auth context.
 * Tables: patients (read), users (read), medications (insert)
 * Auth: useAuth (session required)
 * HIPAA: No PHI beyond medication name entered by the user
 */
import { useState, useEffect } from "react";
import {
  ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";

const UNITS = ["mg", "ml", "mcg", "units", "tablets"];
const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
];

export default function NewMedicationScreen() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [drugName, setDrugName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the patient for this user on mount — no manual Patient ID entry needed
  useEffect(() => {
    if (!user) return;
    supabase
      .from("patients")
      .select("id")
      .eq("created_by", user.id)
      .limit(1)
      .single()
      .then(({ data }) => setPatientId(data?.id ?? null));
  }, [user]);

  async function handleSubmit() {
    setError(null);
    if (!drugName.trim()) {
      setError("Please enter a medication name.");
      return;
    }
    if (!patientId) {
      setError("No patient found. Please set up a patient first.");
      return;
    }
    setLoading(true);

    const { data: me } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user!.id)
      .single();

    const { error: insertError } = await supabase.from("medications").insert({
      patient_id: patientId,
      added_by: user!.id,
      name: drugName.trim(),
      dose: dose.trim() || null,
      unit,
      frequency,
      notes: notes.trim() || null,
      is_active: true,
      organization_id: me?.organization_id ?? null,
    });

    setLoading(false);
    if (insertError) {
      setError("We could not save this medication. Please try again.");
      return;
    }
    router.replace("/(app)/medications");
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add medication</Text>

      <Text style={styles.label}>Medication name</Text>
      <TextInput
        value={drugName}
        onChangeText={setDrugName}
        style={styles.input}
        accessibilityLabel="Medication name"
        placeholder="e.g. Metoprolol"
        placeholderTextColor={C.muted}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Dose</Text>
      <TextInput
        value={dose}
        onChangeText={setDose}
        keyboardType="decimal-pad"
        style={styles.input}
        accessibilityLabel="Dose"
        placeholder="e.g. 25"
        placeholderTextColor={C.muted}
      />

      <Text style={styles.label}>Unit</Text>
      {UNITS.map((u) => (
        <TouchableOpacity
          key={u}
          style={[styles.option, unit === u && styles.optionSelected]}
          onPress={() => setUnit(u)}
          accessibilityRole="radio"
          accessibilityState={{ selected: unit === u }}
        >
          <Text style={styles.optionText}>{u}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Frequency</Text>
      {FREQUENCIES.map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.option, frequency === f && styles.optionSelected]}
          onPress={() => setFrequency(f)}
          accessibilityRole="radio"
          accessibilityState={{ selected: frequency === f }}
        >
          <Text style={styles.optionText}>{f}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notes]}
        multiline
        accessibilityLabel="Notes"
        placeholderTextColor={C.muted}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.primaryButton}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Save medication"
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.primaryButtonText}>Save medication</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const C = {
  primary: "#2C5F4A",
  accent: "#C4714A",
  background: "#F7F2EA",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  border: "#E8E2D9",
  paleSage: "#F0F5F2",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "700", color: C.primary, marginBottom: 16 },
  label: { fontSize: 14, color: C.text, marginTop: 12, marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
    color: C.text,
  },
  notes: { minHeight: 96, textAlignVertical: "top" },
  option: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    backgroundColor: C.card,
    minHeight: 48,
    justifyContent: "center",
  },
  optionSelected: { borderColor: C.primary, backgroundColor: C.paleSage },
  optionText: { color: C.text, fontSize: 15 },
  error: { color: C.accent, marginTop: 16, textAlign: "center", fontSize: 14 },
  primaryButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    minHeight: 48,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
