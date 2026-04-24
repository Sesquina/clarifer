import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { sendPhoneOTP, isValidE164 } from "@/lib/auth/phone";

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState("+1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setError(null);
    if (!isValidE164(phone)) {
      setError("Enter a full phone number in E.164 format, e.g. +15551234567.");
      return;
    }
    setLoading(true);
    const { error } = await sendPhoneOTP(phone);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push({ pathname: "/(auth)/verify-otp", params: { phone } });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Sign in with phone</Text>
      <Text style={styles.subtitle}>We will text you a 6-digit code.</Text>
      <TextInput
        style={styles.input}
        placeholder="+15551234567"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        accessibilityLabel="Phone number"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSend}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Send code"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send code</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
      >
        <Text style={styles.link}>Back to sign in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "700", color: "#2C5F4A", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, minHeight: 48 },
  error: { color: "#c0392b", marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: "#2C5F4A", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 16, minHeight: 48 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: "#2C5F4A", textAlign: "center", fontSize: 14 },
});
