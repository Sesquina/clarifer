/**
 * apps/mobile/app/(app)/patients/[id]/trials.tsx
 * Mobile screen that lists matched clinical trials for a patient and supports save/unsave.
 * Tables: calls /api/trials/search, /api/trials/save, /api/trials/saved; no direct Supabase reads or writes from this screen.
 * Auth: caregiver, patient, or provider role (server enforces); screen assumes authenticated session.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Displays patient diagnosis context and trial matches. No PHI written to logs from this file.
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase-client";

const tokens = {
  background: "#F7F2EA",
  primary: "#2C5F4A",
  accent: "#C4714A",
  card: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  border: "#E8E2D9",
  paleSage: "#F0F5F2",
  paleTerra: "#FDF3EE",
  white: "#FFFFFF",
  radiusCard: 16,
  radiusPill: 26,
  touchMin: 48,
};

interface PlainLanguage {
  five_things_to_know: string[];
  possible_disqualifiers: string[];
  next_step: string;
}
interface Trial {
  source: "clinicaltrials.gov" | "who_ictrp";
  nct_id: string;
  title: string;
  phase: string;
  status: string;
  location: string;
  brief_summary: string;
  external_url: string;
  plain_language: PlainLanguage | null;
  saved: boolean;
}

type Tab = "all" | "saved";
type Source = "all" | "us" | "international";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export default function MobileTrialsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = typeof params.id === "string" ? params.id : "";
  const [tab, setTab] = useState<Tab>("all");
  const [source, setSource] = useState<Source>("all");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [savedTrials, setSavedTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/trials/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ patient_id: patientId, filters: { source } }),
      });
      if (!res.ok) {
        setError(
          "We couldn't reach the trials database. Try again in a moment."
        );
      } else {
        const json = (await res.json()) as { trials: Trial[] };
        setTrials(json.trials || []);
      }
    } catch {
      setError("We couldn't reach the trials database. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [patientId, source]);

  useEffect(() => {
    search();
  }, [search]);

  async function loadSaved() {
    if (!patientId) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const res = await fetch(`${API_BASE}/api/trials/saved?patient_id=${patientId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const json = (await res.json()) as { saves: Array<{ trial_id: string; trial_name: string; phase: string; location: string }> };
    setSavedTrials(
      json.saves.map((s) => ({
        source: "clinicaltrials.gov" as const,
        nct_id: s.trial_id,
        title: s.trial_name ?? s.trial_id,
        phase: s.phase ?? "Not specified",
        status: "Saved",
        location: s.location ?? "",
        brief_summary: "",
        external_url: `https://clinicaltrials.gov/study/${s.trial_id}`,
        plain_language: null,
        saved: true,
      }))
    );
  }

  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function saveTrial(trial: Trial) {
    if (trial.saved) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    await fetch(`${API_BASE}/api/trials/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        patient_id: patientId,
        nct_id: trial.nct_id,
        trial_name: trial.title,
        phase: trial.phase,
        location: trial.location,
      }),
    });
    setTrials((prev) =>
      prev.map((t) => (t.nct_id === trial.nct_id ? { ...t, saved: true } : t))
    );
    loadSaved();
  }

  const visible = tab === "saved" ? savedTrials : trials;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Clinical trials</Text>
      <Text style={styles.subtle}>Plain language. Saved across web and mobile.</Text>

      <View style={styles.tabRow}>
        <TabButton active={tab === "all"} onPress={() => setTab("all")} label="All trials" />
        <TabButton
          active={tab === "saved"}
          onPress={() => setTab("saved")}
          label={`Saved (${savedTrials.length})`}
        />
      </View>

      {tab === "all" && (
        <View style={styles.pillRow}>
          {(
            [
              { value: "all" as const, label: "All" },
              { value: "us" as const, label: "US" },
              { value: "international" as const, label: "International" },
            ]
          ).map((p) => (
            <Pill
              key={p.value}
              active={source === p.value}
              onPress={() => setSource(p.value)}
              label={p.label}
            />
          ))}
        </View>
      )}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={tokens.primary} />
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && visible.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No trials match these filters yet. Try removing a filter, or check back next week.
          </Text>
        </View>
      )}

      {!loading &&
        visible.map((t) => (
          <View key={t.nct_id} style={styles.trialCard}>
            <Text style={styles.trialTitle}>{t.title}</Text>
            <View style={styles.tagRow}>
              <Tag>{t.phase}</Tag>
              <Tag>{t.status}</Tag>
              {t.location ? <Tag muted>{t.location}</Tag> : null}
            </View>
            {t.plain_language ? (
              <>
                <Text style={styles.sectionLabel}>5 things to know</Text>
                {t.plain_language.five_things_to_know.map((s, i) => (
                  <Text key={i} style={styles.bullet}>{`• ${s}`}</Text>
                ))}
                {t.plain_language.possible_disqualifiers.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Possible disqualifiers</Text>
                    {t.plain_language.possible_disqualifiers.map((s, i) => (
                      <Text key={i} style={[styles.bullet, { color: tokens.accent }]}>{`• ${s}`}</Text>
                    ))}
                  </>
                )}
                <Text style={styles.sectionLabel}>Next step</Text>
                <Text style={styles.bodyText}>{t.plain_language.next_step}</Text>
              </>
            ) : (
              <Text style={styles.bodyText}>{t.brief_summary}</Text>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonGhost]}
                onPress={() => saveTrial(t)}
                disabled={t.saved}
                accessibilityLabel={t.saved ? "Saved" : `Save ${t.title}`}
              >
                <Text style={styles.buttonGhostText}>{t.saved ? "Saved" : "Save trial"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => Linking.openURL(t.external_url)}
                accessibilityLabel="Open full record"
              >
                <Text style={styles.buttonPrimaryText}>Open full record</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

function TabButton({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Pill({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      accessibilityLabel={label}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Tag({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <View style={[styles.tag, muted ? { backgroundColor: tokens.paleSage } : { backgroundColor: tokens.paleTerra }]}>
      <Text style={[styles.tagText, { color: muted ? tokens.primary : tokens.accent }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.background },
  content: { padding: 20, paddingBottom: 60 },
  heading: { fontSize: 24, color: tokens.primary, fontWeight: "700", marginBottom: 4 },
  subtle: { fontSize: 14, color: tokens.muted, marginBottom: 16 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: tokens.border, marginBottom: 12 },
  tab: { paddingHorizontal: 16, height: tokens.touchMin, justifyContent: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: tokens.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: tokens.muted },
  tabTextActive: { color: tokens.primary },
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.card,
    justifyContent: "center",
  },
  pillActive: { backgroundColor: tokens.primary, borderColor: tokens.primary },
  pillText: { fontSize: 13, fontWeight: "500", color: tokens.text },
  pillTextActive: { color: tokens.white },
  loadingBox: { padding: 24, alignItems: "center" },
  errorBanner: {
    backgroundColor: tokens.paleTerra,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  errorText: { color: tokens.accent, fontSize: 14 },
  emptyState: {
    padding: 24,
    backgroundColor: tokens.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  emptyText: { color: tokens.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  trialCard: {
    backgroundColor: tokens.card,
    borderRadius: tokens.radiusCard,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.border,
    marginBottom: 14,
  },
  trialTitle: { fontSize: 18, fontWeight: "600", color: tokens.text, marginBottom: 8 },
  tagRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: "500" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: tokens.muted,
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bullet: { fontSize: 14, color: tokens.text, marginBottom: 4, lineHeight: 20 },
  bodyText: { fontSize: 14, color: tokens.text, lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" },
  button: { minHeight: tokens.touchMin, paddingHorizontal: 18, borderRadius: 24, justifyContent: "center" },
  buttonPrimary: { backgroundColor: tokens.primary },
  buttonPrimaryText: { color: tokens.white, fontWeight: "600", fontSize: 14 },
  buttonGhost: { borderWidth: 1, borderColor: tokens.primary, backgroundColor: tokens.card },
  buttonGhostText: { color: tokens.primary, fontWeight: "600", fontSize: 14 },
});
