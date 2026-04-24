import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { sendPasswordReset } from "@/lib/auth/password-reset";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await sendPasswordReset(email);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📬</Text>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          If an account exists for {email}, a password reset link is on its way.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(auth)/login")}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we will send you a link to reset your password.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Send reset link"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send reset link</Text>
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
  container: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  icon: { fontSize: 56, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#2C5F4A", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 24 },
  body: { fontSize: 16, color: "#555", textAlign: "center", lineHeight: 24, marginBottom: 32 },
  input: { alignSelf: "stretch", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, minHeight: 48 },
  error: { color: "#c0392b", marginBottom: 12, textAlign: "center" },
  button: { alignSelf: "stretch", backgroundColor: "#2C5F4A", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 16, minHeight: 48 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: "#2C5F4A", textAlign: "center", fontSize: 14 },
});
