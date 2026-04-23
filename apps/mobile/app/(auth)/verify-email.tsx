import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function VerifyEmailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✉️</Text>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.body}>
        We sent a verification link to your email address. Click the link to
        confirm your account, then return here to sign in.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.buttonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  icon: {
    fontSize: 56,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2C5F4A",
    marginBottom: 16,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#2C5F4A",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
