import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { UserRole, getHomeRouteForRole } from "@/lib/auth-logic";
import { router } from "expo-router";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: "caregiver",
    label: "Caregiver",
    description: "I support a family member or patient",
  },
  {
    value: "patient",
    label: "Patient",
    description: "I'm managing my own care",
  },
  {
    value: "provider",
    label: "Care Provider",
    description: "I'm a clinician or care professional",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "I manage an organization",
  },
];

export default function RoleSelectScreen() {
  const { setRole } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    const { error } = await setRole(selected);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      router.replace(getHomeRouteForRole(selected) as any);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>
      <Text style={styles.subtitle}>
        Select your role so we can personalize your experience.
      </Text>

      {ROLES.map((role) => (
        <TouchableOpacity
          key={role.value}
          style={[styles.card, selected === role.value && styles.cardSelected]}
          onPress={() => setSelected(role.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === role.value }}
        >
          <Text style={[styles.cardLabel, selected === role.value && styles.cardLabelSelected]}>
            {role.label}
          </Text>
          <Text style={styles.cardDescription}>{role.description}</Text>
        </TouchableOpacity>
      ))}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected || loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C5F4A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: "#2C5F4A",
    backgroundColor: "#f0f7f4",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardLabelSelected: {
    color: "#2C5F4A",
  },
  cardDescription: {
    fontSize: 13,
    color: "#888",
  },
  error: {
    color: "#c0392b",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2C5F4A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
