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
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { signInWithGoogle } from "@/lib/auth/google";
import { signInWithApple } from "@/lib/auth/apple";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      router.push("/(auth)/verify-email");
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  }

  async function handleApple() {
    setError(null);
    try {
      const { error } = await signInWithApple();
      if (error) setError(error.message);
    } catch {
      // user cancelled the native prompt
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Clarifer to get started</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          accessibilityLabel="Confirm password"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign up with</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogle}
          accessibilityRole="button"
          accessibilityLabel="Sign up with Google"
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleApple}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Apple"
          >
            <Text style={styles.appleButtonText}> Continue with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "700", color: "#2C5F4A", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16, minHeight: 48 },
  error: { color: "#c0392b", marginBottom: 12, textAlign: "center" },
  primaryButton: { backgroundColor: "#2C5F4A", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 16, minHeight: 48 },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 12, color: "#666", fontSize: 13 },
  googleButton: { backgroundColor: "#fff", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 12, minHeight: 48, borderWidth: 1, borderColor: "#ddd" },
  googleButtonText: { color: "#1A1A1A", fontWeight: "600", fontSize: 15 },
  appleButton: { backgroundColor: "#000", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 16, minHeight: 48 },
  appleButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  link: { color: "#2C5F4A", textAlign: "center", fontSize: 14, marginVertical: 8 },
});
