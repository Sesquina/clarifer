import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase-client";
import { colors, spacing, radius, typography, touchTarget } from "@/lib/design-tokens";

interface EmergencyData {
  patient: {
    id: string;
    name: string;
    dob: string | null;
    custom_diagnosis: string | null;
    blood_type: string | null;
    allergies: string[] | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_notes: string | null;
    dpd_deficiency_screened: boolean | null;
    dpd_deficiency_status: string | null;
  };
  medications: Array<{ name: string; dose: string | null; unit: string | null; route: string | null; frequency: string | null }>;
  biomarkers: Array<{ biomarker_type: string; status: string; value: string | null }>;
  generated_at: string;
}

function ageFromDob(dob: string | null): string {
  if (!dob) return "";
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

function formatDob(dob: string | null): string {
  if (!dob) return "Not recorded";
  return new Date(dob).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const CACHE_KEY = (id: string) => `clarifer:emergency-card:${id}`;

export default function EmergencyCardMobile() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    // Hydrate from AsyncStorage first to keep the card usable offline.
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY(id));
      if (cached) setData(JSON.parse(cached) as EmergencyData);
    } catch { /* ignore */ }

    try {
      const [patientRes, medsRes, biomarkersRes] = await Promise.all([
        supabase.from("patients").select(
          "id, name, dob, custom_diagnosis, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_notes, dpd_deficiency_screened, dpd_deficiency_status"
        ).eq("id", id).single(),
        supabase.from("medications").select("name, dose, unit, route, frequency")
          .eq("patient_id", id).eq("is_active", true),
        supabase.from("biomarkers").select("biomarker_type, status, value")
          .eq("patient_id", id),
      ]);
      if (patientRes.data) {
        const next: EmergencyData = {
          patient: patientRes.data as EmergencyData["patient"],
          medications: (medsRes.data ?? []) as EmergencyData["medications"],
          biomarkers: (biomarkersRes.data ?? []) as EmergencyData["biomarkers"],
          generated_at: new Date().toISOString(),
        };
        setData(next);
        await AsyncStorage.setItem(CACHE_KEY(id), JSON.stringify(next));
      }
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.loading}>
        <Text style={styles.subtle}>We could not load this card right now.</Text>
      </View>
    );
  }

  const p = data.patient;
  const positives = data.biomarkers.filter((b) => b.status === "positive");

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Showing cached card. Last refreshed {new Date(data.generated_at).toLocaleString()}.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Emergency Medical Card</Text>
            <Text style={styles.headerBrand}>Clarifer</Text>
          </View>
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>URGENT</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.bigName}>{p.name.toUpperCase()}</Text>
          <Text style={styles.meta}>DOB: {formatDob(p.dob)}{p.dob ? ` · Age: ${ageFromDob(p.dob)}` : ""}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Diagnosis</Text>
          <Text style={styles.value}>{p.custom_diagnosis ?? "Not recorded"}</Text>
          {positives.length > 0 && (
            <Text style={styles.subtle}>
              Biomarkers: {positives.map((b) => `${b.biomarker_type}${b.value ? ` (${b.value})` : ""}`).join(", ")}
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Current Medications</Text>
          {data.medications.length === 0 ? (
            <Text style={styles.value}>No active medications on file.</Text>
          ) : (
            data.medications.map((m, idx) => (
              <Text key={idx} style={styles.bullet}>
                • {m.name} {[m.dose, m.unit].filter(Boolean).join(" ")}{m.route ? ` ${m.route}` : ""}
              </Text>
            ))
          )}
        </View>

        {(p.blood_type || (p.allergies && p.allergies.length > 0)) && (
          <View style={styles.row}>
            {p.blood_type && <Text style={styles.value}><Text style={styles.bold}>Blood type: </Text>{p.blood_type}</Text>}
            {p.allergies && p.allergies.length > 0 && (
              <Text style={styles.value}><Text style={styles.bold}>Allergies: </Text>{p.allergies.join(", ")}</Text>
            )}
          </View>
        )}

        <View style={[styles.row, styles.alert]}>
          <Text style={styles.alertLabel}>Critical Alerts</Text>
          <Text style={styles.alertValue}>
            DPD screening status: {p.dpd_deficiency_status || (p.dpd_deficiency_screened ? "Completed" : "Unknown")}
          </Text>
          <Text style={styles.alertNote}>Do not administer 5-FU or Capecitabine without DPD test.</Text>
          {p.emergency_notes ? <Text style={styles.alertNote}>{p.emergency_notes}</Text> : null}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Emergency Contact</Text>
          <Text style={styles.value}>{p.emergency_contact_name ?? "Not recorded"}</Text>
          {p.emergency_contact_phone ? (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => Linking.openURL(`tel:${p.emergency_contact_phone?.replace(/[^0-9+]/g, "")}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${p.emergency_contact_name ?? "emergency contact"}`}
            >
              <Text style={styles.callButtonText}>Tap to call {p.emergency_contact_phone}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.subtle}>No phone number on file.</Text>
          )}
        </View>
      </View>

      <Text style={styles.footer}>
        Clarifer is a care-coordination tool, not a medical record. For medical decisions consult the care team.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  subtle: { color: colors.muted, fontSize: typography.sizeMeta, marginTop: spacing.xs },
  offlineBanner: { backgroundColor: colors.paleTerra, padding: spacing.sm, borderRadius: radius.tile, marginBottom: spacing.sm },
  offlineText: { color: colors.accent, fontSize: typography.sizeMeta },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
  },
  headerLabel: { color: colors.white, fontSize: typography.sizeMeta, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 },
  headerBrand: { color: colors.white, fontSize: typography.sizeTitle, fontWeight: typography.weightBold },
  urgentBadge: { backgroundColor: colors.accent, paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs, borderRadius: radius.pill },
  urgentBadgeText: { color: colors.white, fontWeight: typography.weightBold, fontSize: typography.sizeMeta, letterSpacing: 1 },
  row: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  bigName: { fontSize: typography.sizeHero, fontWeight: typography.weightBold, color: colors.text },
  meta: { marginTop: spacing.xs, color: colors.muted, fontSize: typography.sizeLabel },
  label: { fontSize: typography.sizeMeta, color: colors.muted, fontWeight: typography.weightSemibold, textTransform: "uppercase", letterSpacing: 1 },
  value: { fontSize: typography.sizeBody, color: colors.text, marginTop: spacing.xs },
  bullet: { fontSize: typography.sizeBody, color: colors.text, marginTop: spacing.xs },
  bold: { fontWeight: typography.weightSemibold },
  alert: { backgroundColor: colors.paleTerra, borderLeftWidth: 4, borderLeftColor: colors.accent },
  alertLabel: { fontSize: typography.sizeMeta, color: colors.accent, fontWeight: typography.weightSemibold, textTransform: "uppercase", letterSpacing: 1 },
  alertValue: { marginTop: spacing.xs, fontSize: typography.sizeBody, color: colors.text, fontWeight: typography.weightSemibold },
  alertNote: { marginTop: spacing.xs, fontSize: typography.sizeLabel, color: colors.text },
  callButton: {
    marginTop: spacing.sm, backgroundColor: colors.primary,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.input, alignItems: "center", justifyContent: "center",
    minHeight: touchTarget.minimum,
  },
  callButtonText: { color: colors.white, fontWeight: typography.weightSemibold, fontSize: typography.sizeBody },
  footer: { marginTop: spacing.md, textAlign: "center", color: colors.muted, fontSize: typography.sizeMeta },
});
