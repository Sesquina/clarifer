import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

const ROLES = [
  "oncologist",
  "nurse",
  "home health aide",
  "social worker",
  "palliative care specialist",
  "radiologist",
  "surgeon",
  "pharmacist",
  "physical therapist",
  "other",
];

export default function NewCareMemberScreen() {
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hospital, setHospital] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !patientId.trim()) {
      setError("Please include a patient and a name.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Please sign in to continue."); setLoading(false); return; }
    const { data: me } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
    const { error: insertError } = await supabase.from("care_relationships").insert({
      patient_id: patientId,
      invited_by: user.id,
      relationship_type: role,
      access_level: JSON.stringify({
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        hospital: hospital || null,
        notes: notes || null,
      }),
      organization_id: me?.organization_id ?? null,
      invited_at: new Date().toISOString(),
    });
    setLoading(false);
    if (insertError) {
      setError("We could not add this member. Please try again.");
      return;
    }
    router.replace("/(app)/care-team");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add a care team member</Text>

      <Text style={styles.label}>Patient ID</Text>
      <TextInput value={patientId} onChangeText={setPatientId} style={styles.input} accessibilityLabel="Patient ID" />

      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} accessibilityLabel="Name" />

      <Text style={styles.label}>Role</Text>
      {ROLES.map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.option, role === r && styles.optionSelected]}
          onPress={() => setRole(r)}
          accessibilityRole="radio"
          accessibilityState={{ selected: role === r }}
        >
          <Text style={styles.optionText}>{r}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Phone (optional)</Text>
      <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" accessibilityLabel="Phone" />

      <Text style={styles.label}>Email (optional)</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" accessibilityLabel="Email" />

      <Text style={styles.label}>Hospital or clinic (optional)</Text>
      <TextInput value={hospital} onChangeText={setHospital} style={styles.input} accessibilityLabel="Hospital" />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.notes]} multiline accessibilityLabel="Notes" />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Save care team member"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save</Text>}
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
