import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { router } from "expo-router";

export default function ProviderHomeScreen() {
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Provider Dashboard</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.tile}>
          <Text style={styles.tileIcon}>👥</Text>
          <Text style={styles.tileLabel}>All Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile}>
          <Text style={styles.tileIcon}>📋</Text>
          <Text style={styles.tileLabel}>Care Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile}>
          <Text style={styles.tileIcon}>📊</Text>
          <Text style={styles.tileLabel}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile}>
          <Text style={styles.tileIcon}>🔬</Text>
          <Text style={styles.tileLabel}>Trials</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f8f9fa" },
  greeting: { fontSize: 26, fontWeight: "700", color: "#2C5F4A", marginTop: 48, marginBottom: 4 },
  email: { fontSize: 14, color: "#888", marginBottom: 32 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tileIcon: { fontSize: 32, marginBottom: 8 },
  tileLabel: { fontSize: 14, fontWeight: "600", color: "#333" },
  signOut: { marginTop: "auto", alignItems: "center", padding: 16 },
  signOutText: { color: "#c0392b", fontSize: 14 },
});
