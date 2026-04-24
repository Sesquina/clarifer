import { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { sendPhoneOTP, verifyPhoneOTP } from "@/lib/auth/phone";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof params.phone === "string" ? params.phone : "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (code.length === 6) {
      verify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function verify(otp: string) {
    if (!phone) {
      setError("Missing phone number. Please start over.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await verifyPhoneOTP(phone, otp);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/(home)/caregiver");
  }

  async function resend() {
    if (cooldown > 0 || !phone) return;
    setError(null);
    const { error } = await sendPhoneOTP(phone);
    if (error) {
      setError(error.message);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Enter your code</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}.</Text>
      <TextInput
        style={styles.otpInput}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, ""))}
        accessibilityLabel="6-digit verification code"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => verify(code)}
        disabled={loading || code.length !== 6}
        accessibilityRole="button"
        accessibilityLabel="Verify"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={resend}
        disabled={cooldown > 0}
        accessibilityRole="button"
        accessibilityLabel={cooldown > 0 ? `Resend in ${cooldown} seconds` : "Resend code"}
      >
        <Text style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "700", color: "#2C5F4A", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 24 },
  otpInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 24, letterSpacing: 8, textAlign: "center", minHeight: 56 },
  error: { color: "#c0392b", marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: "#2C5F4A", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 16, minHeight: 48 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  link: { color: "#2C5F4A", textAlign: "center", fontSize: 14 },
  linkDisabled: { color: "#999" },
});
