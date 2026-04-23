import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { getHomeRouteForRole } from "@/lib/auth-logic";
import { router } from "expo-router";

export default function CareTeamSetupScreen() {
  const { role } = useAuth();
  const [caregiverEmail, setCaregiverEmail] = useState("");

  function handleSkip() {
    if (!role) {
      router.replace("/(auth)/role-select");
      return;
    }
    router.replace(getHomeRouteForRole(role) as any);
  }

  function handleInvite() {
    // Invite flow — simplified for MVP: navigate home after "sending"
    handleSkip();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your care team</Text>
      <Text style={styles.subtitle}>
        Invite caregivers or family members who will help manage care.
        You can always do this later.
      </Text>

      <Text style={styles.label}>Caregiver email (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="caregiver@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={caregiverEmail}
        onChangeText={setCaregiverEmail}
        accessibilityLabel="Caregiver email"
      />

      <TouchableOpacity
        style={[styles.button, !caregiverEmail && styles.buttonDisabled]}
        onPress={handleInvite}
        disabled={!caregiverEmail}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Send Invite</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "700", color: "#2C5F4A", marginTop: 48, marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 32, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2C5F4A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  skipButton: { alignItems: "center", padding: 12 },
  skipText: { color: "#888", fontSize: 14 },
});
