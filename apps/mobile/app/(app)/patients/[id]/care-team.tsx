/**
 * apps/mobile/app/(app)/patients/[id]/care-team.tsx
 * Care team directory mobile screen.
 * Tables: reads /api/care-team and /api/care-team/[id]/message-templates;
 *         no direct Supabase reads.
 * Auth: caregiver, patient, provider, admin (server enforces).
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: Provider contact info. Org-scoped. Phone/email taps open the
 * device's native dialer / mail client. Templates copy to clipboard at
 * user request. No PHI written to logs from this file.
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  FlatList,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase-client";
import { colors, radius, spacing, touchTarget } from "@/lib/design-tokens";

interface Member {
  id: string;
  name: string;
  role: string | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_primary: boolean | null;
}

interface Template {
  id: string;
  label: string;
  body: string;
}

const COPY = {
  title: "Care Team",
  empty: "Your care team will appear here. Add your first provider to get started.",
  add: "Add Member",
  primary: "Primary",
  templates: "Quick messages",
  copied: "Copied to clipboard",
  loadError: "We could not load your care team. Try again in a moment.",
} as const;

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export default function MobileCareTeamScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = typeof params.id === "string" ? params.id : "";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [templatesByMember, setTemplatesByMember] = useState<Record<string, Template[]>>({});
  const [role, setRole] = useState<string | null>(null);

  const canEdit = role === "caregiver" || role === "admin";

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/care-team?patient_id=${encodeURIComponent(patientId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setError(COPY.loadError);
        setMembers([]);
      } else {
        const json = (await res.json()) as { members: Member[] };
        setMembers(json.members ?? []);
      }
      // Best-effort role lookup
      const userRes = await fetch(`${API_BASE}/api/auth/session`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);
      if (userRes && userRes.ok) {
        const me = (await userRes.json().catch(() => ({}))) as { role?: string | null };
        setRole(me.role ?? null);
      }
    } catch {
      setError(COPY.loadError);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadTemplates(memberId: string) {
    if (templatesByMember[memberId]) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const res = await fetch(`${API_BASE}/api/care-team/${memberId}/message-templates`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const json = (await res.json()) as { templates: Template[] };
      setTemplatesByMember((prev) => ({ ...prev, [memberId]: json.templates ?? [] }));
    }
  }

  function toggleTemplates(memberId: string) {
    if (openMemberId === memberId) {
      setOpenMemberId(null);
      return;
    }
    setOpenMemberId(memberId);
    loadTemplates(memberId);
  }

  async function copyTemplate(text: string) {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === "android") {
      ToastAndroid.show(COPY.copied, ToastAndroid.SHORT);
    } else {
      Alert.alert("", COPY.copied);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{COPY.title}</Text>
        {canEdit && (
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            accessibilityLabel={COPY.add}
          >
            <Text style={styles.addButtonText}>{COPY.add}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyState} accessibilityLabel="empty-state">
          <Text style={styles.emptyText}>{COPY.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
          renderItem={({ item: m }) => (
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{m.name}</Text>
                {m.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>{COPY.primary}</Text>
                  </View>
                )}
              </View>
              {(m.role || m.specialty) && (
                <Text style={styles.subtitle}>
                  {[m.role, m.specialty].filter(Boolean).join(" -- ")}
                </Text>
              )}

              <View style={styles.contactRow}>
                {m.phone && (
                  <TouchableOpacity
                    style={[styles.button, styles.contactPrimary]}
                    onPress={() => Linking.openURL(`tel:${m.phone}`)}
                    accessibilityLabel={`call ${m.name}`}
                  >
                    <Text style={styles.contactPrimaryText}>{m.phone}</Text>
                  </TouchableOpacity>
                )}
                {m.email && (
                  <TouchableOpacity
                    style={[styles.button, styles.contactGhost]}
                    onPress={() => Linking.openURL(`mailto:${m.email}`)}
                    accessibilityLabel={`email ${m.name}`}
                  >
                    <Text style={styles.contactGhostText}>{m.email}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {m.notes && (
                <View style={styles.notesBlock}>
                  <Text style={styles.notesText}>{m.notes}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, styles.templatesToggle]}
                onPress={() => toggleTemplates(m.id)}
                accessibilityLabel={COPY.templates}
              >
                <Text style={styles.templatesToggleText}>{COPY.templates}</Text>
              </TouchableOpacity>

              {openMemberId === m.id && (
                <View style={styles.templatesList}>
                  {(templatesByMember[m.id] ?? []).map((tpl) => (
                    <TouchableOpacity
                      key={tpl.id}
                      style={[styles.button, styles.templatePill]}
                      onPress={() => copyTemplate(tpl.body)}
                      accessibilityLabel={`copy ${tpl.label}`}
                    >
                      <Text style={styles.templatePillText}>{tpl.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {(templatesByMember[m.id] ?? []).length === 0 && (
                    <Text style={styles.emptyTemplatesText}>No templates yet.</Text>
                  )}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: { fontSize: 28, color: colors.primary, fontWeight: "700" },
  button: {
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.md + 4,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: { backgroundColor: colors.accent },
  addButtonText: { color: colors.white, fontWeight: "600", fontSize: 14 },
  loadingBox: { padding: spacing.lg, alignItems: "center" },
  errorBanner: {
    margin: spacing.lg,
    backgroundColor: colors.paleTerra,
    borderRadius: radius.tile,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: { color: colors.accent, fontSize: 14 },
  emptyState: {
    margin: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md + 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { fontSize: 18, fontWeight: "600", color: colors.text },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.paleSage,
  },
  primaryBadgeText: { fontSize: 11, fontWeight: "600", color: colors.primary },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  contactPrimary: { backgroundColor: colors.primary },
  contactPrimaryText: { color: colors.white, fontWeight: "600", fontSize: 14 },
  contactGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  contactGhostText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  notesBlock: { marginTop: spacing.md },
  notesText: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  templatesToggle: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  templatesToggleText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  templatesList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  templatePill: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  templatePillText: { color: colors.primary, fontWeight: "500", fontSize: 13 },
  emptyTemplatesText: { color: colors.muted, fontSize: 13, padding: 4 },
});
