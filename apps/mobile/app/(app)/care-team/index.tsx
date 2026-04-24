import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

type CareMember = {
  id: string;
  relationship_type: string | null;
  access_level: string | null; // stored JSON string: { name, phone, email, hospital, notes }
};

function parseDetails(raw: string | null): { name?: string; phone?: string; email?: string; hospital?: string } {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function CareTeamIndex() {
  const [members, setMembers] = useState<CareMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("care_relationships")
        .select("id, relationship_type, access_level");
      setMembers(((data ?? []) as CareMember[]));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Care team</Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/care-team/new")}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add care team member"
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2C5F4A" />
      ) : members.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No care team yet</Text>
          <Text style={styles.emptyBody}>Add your care team so you can reach them when it matters.</Text>
        </View>
      ) : (
        members.map((m) => {
          const d = parseDetails(m.access_level);
          return (
            <View key={m.id} style={styles.card}>
              <Text style={styles.name}>{d.name ?? "Team member"}</Text>
              <Text style={styles.role}>{m.relationship_type ?? "Role"}</Text>
              {d.hospital && <Text style={styles.hospital}>{d.hospital}</Text>}
              <View style={styles.actions}>
                {d.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${d.phone}`)}
                    style={styles.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${d.name ?? "team member"}`}
                  >
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>
                )}
                {d.email && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${d.email}`)}
                    style={styles.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Email ${d.name ?? "team member"}`}
                  >
                    <Text style={styles.actionText}>Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA" },
  content: { padding: 16, paddingBottom: 48 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, color: "#2C5F4A", fontWeight: "700" },
  addButton: { backgroundColor: "#2C5F4A", paddingHorizontal: 16, borderRadius: 12, minHeight: 48, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "600" },
  empty: { backgroundColor: "#FFFFFF", padding: 24, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E8E2D9" },
  emptyTitle: { fontSize: 16, color: "#2C5F4A", fontWeight: "600" },
  emptyBody: { marginTop: 6, fontSize: 14, color: "#6B6B6B", textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "#E8E2D9" },
  name: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  role: { fontSize: 13, color: "#C4714A", marginTop: 2 },
  hospital: { marginTop: 4, fontSize: 13, color: "#6B6B6B" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionButton: { borderWidth: 1, borderColor: "#E8E2D9", borderRadius: 12, paddingHorizontal: 16, minHeight: 48, justifyContent: "center" },
  actionText: { color: "#2C5F4A", fontWeight: "600" },
});
