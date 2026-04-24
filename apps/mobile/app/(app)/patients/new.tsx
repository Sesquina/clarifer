import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

type Condition = { id: string; slug: string | null; name: string };

export default function NewPatientScreen() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [conditionId, setConditionId] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("condition_templates")
        .select("id, slug, name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (data && data.length > 0) {
        setConditions(data as Condition[]);
        setConditionId(data[0].id);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!fullName.trim()) {
      setError("Please enter the patient's full name.");
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/patients/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          date_of_birth: dob,
          diagnosis: diagnosis.trim(),
          condition_template_id: conditionId,
        }),
      }).catch(async () => {
        // Fallback: direct DB insert via supabase-js (mirrors the API semantics).
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { data: me } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
        const { data: row, error } = await supabase.from("patients").insert({
          name: fullName.trim(),
          dob: dob || null,
          custom_diagnosis: diagnosis || null,
          condition_template_id: conditionId || null,
          organization_id: me?.organization_id ?? null,
          created_by: user.id,
        }).select("id").single();
        if (error) throw error;
        return { ok: true, json: async () => ({ id: row?.id }) } as Response;
      });
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      const body = await res.json();
      router.replace(`/(app)/patients/${body.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Let&apos;s set up your first patient</Text>
      <Text style={styles.subtitle}>Tell us who you&apos;re caring for.</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput value={fullName} onChangeText={setFullName} style={styles.input} accessibilityLabel="Patient full name" />

      <Text style={styles.label}>Date of birth</Text>
      <TextInput
        value={dob}
        onChangeText={setDob}
        placeholder="YYYY-MM-DD"
        style={styles.input}
        accessibilityLabel="Date of birth"
      />

      <Text style={styles.label}>Primary diagnosis</Text>
      <TextInput value={diagnosis} onChangeText={setDiagnosis} style={styles.input} accessibilityLabel="Diagnosis" />

      <Text style={styles.label}>Condition</Text>
      {conditions.length === 0 ? (
        <Text style={styles.subtleText}>Loading options…</Text>
      ) : (
        conditions.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setConditionId(c.id)}
            style={[styles.conditionRow, conditionId === c.id && styles.conditionRowSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected: conditionId === c.id }}
          >
            <Text style={styles.conditionText}>{c.name}</Text>
          </TouchableOpacity>
        ))
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Add patient"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Add patient</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 48, backgroundColor: "#F7F2EA" },
  title: { fontSize: 28, fontWeight: "700", color: "#2C5F4A", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#6B6B6B", marginBottom: 24 },
  label: { fontSize: 14, color: "#1A1A1A", marginTop: 12, marginBottom: 6, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#E8E2D9", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, fontSize: 16, minHeight: 48 },
  subtleText: { fontSize: 14, color: "#6B6B6B", padding: 14 },
  conditionRow: { borderWidth: 1, borderColor: "#E8E2D9", borderRadius: 12, padding: 14, marginTop: 8, backgroundColor: "#FFFFFF", minHeight: 48 },
  conditionRowSelected: { borderColor: "#2C5F4A", backgroundColor: "#F0F5F2" },
  conditionText: { fontSize: 15, color: "#1A1A1A" },
  error: { color: "#C4714A", marginTop: 16, textAlign: "center", fontSize: 14 },
  primaryButton: { backgroundColor: "#2C5F4A", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24, minHeight: 48 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
