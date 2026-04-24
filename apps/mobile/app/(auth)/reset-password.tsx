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
import { updatePassword } from "@/lib/auth/password-reset";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/(auth)/login");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Set a new password</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="New password"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        accessibilityLabel="Confirm new password"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Update password"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update password</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "700", color: "#2C5F4A", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, minHeight: 48 },
  error: { color: "#c0392b", marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: "#2C5F4A", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 16, minHeight: 48 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
