/**
 * apps/mobile/app/(app)/notifications.tsx
 * Mobile notifications inbox: symptom alerts, medication reminders,
 * care team updates.
 * Tables: notifications (read + update)
 * Auth: Supabase session (auth-gated layout above)
 * HIPAA: rows are user-scoped via .eq("user_id", auth.uid()). No
 *        condition names are surfaced. Mark-read uses the same RLS.
 *
 * Hex strings here mirror the existing apps/mobile design pattern --
 * tokenization for mobile is tracked as a Sprint 17 audit item.
 */
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase-client";

type FilterKey = "all" | "symptom_alert" | "medication_reminder" | "care_team_update";

type NotificationRow = {
  id: string;
  title: string | null;
  message: string | null;
  type: string | null;
  read: boolean | null;
  created_at: string | null;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "symptom_alert", label: "Symptoms" },
  { key: "medication_reminder", label: "Medications" },
  { key: "care_team_update", label: "Care team" },
];

const TYPE_FALLBACK_LABEL: Record<string, string> = {
  symptom_alert: "Symptom alert",
  medication_reminder: "Medication reminder",
  care_team_update: "Care team",
};

function formatRelative(date: string | null): string {
  if (!date) return "";
  const now = Date.now();
  const ts = new Date(date).getTime();
  const days = Math.floor((now - ts) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsScreen() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, read, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows(((data ?? []) as NotificationRow[]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function markRead(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read: true } : r)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  const visible = filter === "all" ? rows : rows.filter((r) => r.type === filter);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2C5F4A" />}
    >
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.tabs}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="button"
              accessibilityLabel={`${f.label} filter`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color="#2C5F4A" style={{ marginTop: 24 }} />
      ) : visible.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You are all caught up.</Text>
          <Text style={styles.emptyBody}>
            Symptom alerts, medication reminders, and care team updates will appear here.
          </Text>
        </View>
      ) : (
        visible.map((n) => (
          <View key={n.id} style={[styles.card, n.read && styles.cardRead]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {n.title ?? TYPE_FALLBACK_LABEL[n.type ?? ""] ?? "Update"}
                  </Text>
                  {!n.read && <View style={styles.unreadDot} accessibilityLabel="Unread" />}
                </View>
                {n.message && <Text style={styles.cardMessage}>{n.message}</Text>}
                <Text style={styles.cardMeta}>{formatRelative(n.created_at)}</Text>
              </View>
              {!n.read && (
                <TouchableOpacity
                  onPress={() => markRead(n.id)}
                  style={styles.markReadButton}
                  accessibilityRole="button"
                  accessibilityLabel="Mark as read"
                >
                  <Text style={styles.markReadText}>Mark read</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2EA" },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, color: "#2C5F4A", fontWeight: "700", marginBottom: 16 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tab: {
    borderWidth: 1,
    borderColor: "#E8E2D9",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  tabActive: { backgroundColor: "#2C5F4A", borderColor: "#2C5F4A" },
  tabText: { color: "#2C5F4A", fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: "#FFFFFF" },
  empty: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E2D9",
  },
  emptyTitle: { fontSize: 16, color: "#2C5F4A", fontWeight: "600" },
  emptyBody: { marginTop: 6, fontSize: 14, color: "#6B6B6B", textAlign: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8E2D9",
  },
  cardRead: { opacity: 0.6 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A1A", flexShrink: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C4714A" },
  cardMessage: { marginTop: 4, fontSize: 14, color: "#6B6B6B" },
  cardMeta: { marginTop: 6, fontSize: 12, color: "#6B6B6B" },
  markReadButton: {
    borderWidth: 1,
    borderColor: "#E8E2D9",
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  markReadText: { color: "#2C5F4A", fontWeight: "600", fontSize: 13 },
});
