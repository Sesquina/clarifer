import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

const UNITS = ["mg", "ml", "mcg", "units", "tablets"];
const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
];

export default function NewMedicationScreen() {
  const [drugName, setDrugName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!drugName.trim()) {
      setError("Please enter a medication name.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in to continue."); setLoading(false); return; }
    const { data: me } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
    const { error: insertError } = await supabase.from("medications").insert({
      patient_id: patientId || null,
      added_by: user.id,
      name: drugName.trim(),
      dose: dose || null,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add medication</Text>

      <Text style={styles.label}>Patient ID</Text>
      <TextInput value={patientId} onChangeText={setPatientId} style={styles.input} accessibilityLabel="Patient ID" />

      <Text style={styles.label}>Medication name</Text>
      <TextInput value={drugName} onChangeText={setDrugName} style={styles.input} accessibilityLabel="Medication name" />

      <Text style={styles.label}>Dose</Text>
      <TextInput value={dose} onChangeText={setDose} keyboardType="numeric" style={styles.input} accessibilityLabel="Dose" />

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
      <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.notes]} multiline accessibilityLabel="Notes" />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.primaryButton}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Save medication"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save medication</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA" },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: "700", color: "#2C5F4A", marginBottom: 16 },
  label: { fontSize: 14, color: "#1A1A1A", marginTop: 12, marginBottom: 6, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#E8E2D9", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, fontSize: 16, minHeight: 48 },
  notes: { minHeight: 96, textAlignVertical: "top" },
  option: { borderWidth: 1, borderColor: "#E8E2D9", borderRadius: 12, padding: 12, marginTop: 6, backgroundColor: "#FFFFFF", minHeight: 48 },
  optionSelected: { borderColor: "#2C5F4A", backgroundColor: "#F0F5F2" },
  optionText: { color: "#1A1A1A", fontSize: 15 },
  error: { color: "#C4714A", marginTop: 16, textAlign: "center", fontSize: 14 },
  primaryButton: { backgroundColor: "#2C5F4A", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24, minHeight: 48 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
