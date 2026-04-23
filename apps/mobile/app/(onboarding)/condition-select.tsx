import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

const CONDITIONS = [
  { id: "dementia", label: "Dementia", description: "Memory loss, confusion, behavioral changes" },
  { id: "alzheimers", label: "Alzheimer's Disease", description: "Progressive memory and cognitive decline" },
  { id: "parkinsons", label: "Parkinson's Disease", description: "Movement, tremor, balance difficulties" },
  { id: "ms", label: "Multiple Sclerosis", description: "Neurological symptoms, fatigue, mobility" },
  { id: "other", label: "Other / Not Listed", description: "I'll describe my condition separately" },
];

export default function ConditionSelectScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  function handleContinue() {
    if (!selected) return;
    router.push("/(onboarding)/care-team-setup");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>What condition are you managing?</Text>
      <Text style={styles.subtitle}>
        This helps us tailor symptom tracking and resources for you.
      </Text>

      {CONDITIONS.map((condition) => (
        <TouchableOpacity
          key={condition.id}
          style={[styles.card, selected === condition.id && styles.cardSelected]}
          onPress={() => setSelected(condition.id)}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === condition.id }}
        >
          <Text style={[styles.cardLabel, selected === condition.id && styles.cardLabelSelected]}>
            {condition.label}
          </Text>
          <Text style={styles.cardDescription}>{condition.description}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, !selected && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#2C5F4A", marginTop: 48, marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 28, lineHeight: 22 },
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
  cardLabel: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  cardLabelSelected: { color: "#2C5F4A" },
  cardDescription: { fontSize: 13, color: "#888" },
  button: {
    backgroundColor: "#2C5F4A",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
