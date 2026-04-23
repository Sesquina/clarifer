import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { getHomeRouteForRole } from "@/lib/auth-logic";
import { router } from "expo-router";

const DISCLAIMER_TEXT = `IMPORTANT MEDICAL DISCLAIMER

Clarifer is an informational and care-coordination tool. It is NOT a substitute for professional medical advice, diagnosis, or treatment.

HIPAA Notice
Clarifer collects and processes health-related information to support your care coordination activities. We handle this data in accordance with applicable privacy laws including HIPAA. Your information is encrypted in transit and at rest and is never sold to third parties.

No Doctor-Patient Relationship
Use of this app does not establish a doctor-patient relationship. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

Emergency Situations
Never use this app in a medical emergency. If you believe you have a medical emergency, call 911 or your local emergency number immediately.

Accuracy of Information
Symptom tracking data and AI-generated summaries are tools to assist—not replace—clinical judgment. They may contain errors. Always verify important health information with a licensed healthcare professional.

By tapping "I Agree" you confirm that you have read and understood this disclaimer and agree to use Clarifer in accordance with these terms.`;

export default function MedicalDisclaimerModal() {
  const { acceptDisclaimer, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    const { error } = await acceptDisclaimer();
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (role) {
      router.replace(getHomeRouteForRole(role) as any);
    } else {
      router.replace("/(auth)/role-select");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Disclaimer</Text>
      <Text style={styles.version}>Version 1.0 — Required before use</Text>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
        <Text style={styles.body}>{DISCLAIMER_TEXT}</Text>
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={handleAccept}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>I Agree — Continue</Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C5F4A",
    marginTop: 24,
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    color: "#888",
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
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
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
