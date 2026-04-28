/**
 * apps/mobile/app/(app)/patients/[id]/family-update.tsx
 * Mobile screen that streams a generated family update and lets the user copy or share it via WhatsApp.
 * Tables: calls /api/family-update/generate; no direct Supabase reads or writes from this screen.
 * Auth: caregiver or patient role (server enforces); screen assumes authenticated session.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Displays generated update text; clipboard and Share sheet expose it to OS-level apps at user's choice. No PHI written to logs from this file.
 */
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Share,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
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
  paleTerra: "#FDF3EE",
  white: "#FFFFFF",
  radiusCard: 16,
  touchMin: 48,
};

type Lang = "en" | "es";
type Range = 7 | 14 | 30;

const COPY = {
  en: {
    title: "Update your family",
    subhead: "Pull this week's care into a message. Ready for WhatsApp.",
    range: ["Last 7 days", "Last 14 days", "Last 30 days"] as const,
    generate: "Generate update",
    generating: "Writing...",
    copy: "Copy",
    share: "Share",
    whatsapp: "WhatsApp",
    empty: "Pull together what happened this week. We'll write the first draft. You edit and send.",
    error: "We couldn't generate the update right now. Try again in a moment.",
    copied: "Copied to clipboard.",
  },
  es: {
    title: "Actualizar a tu familia",
    subhead: "Reunimos los cuidados de la semana en un mensaje. Listo para WhatsApp.",
    range: ["Ultimos 7 dias", "Ultimos 14 dias", "Ultimos 30 dias"] as const,
    generate: "Generar actualizacion",
    generating: "Escribiendo...",
    copy: "Copiar",
    share: "Compartir",
    whatsapp: "WhatsApp",
    empty: "Reunamos lo que paso esta semana. Escribimos el borrador. Tu lo editas y lo envias.",
    error: "No pudimos generar la actualizacion ahora. Intenta en un momento.",
    copied: "Copiado al portapapeles.",
  },
} as const;

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export default function MobileFamilyUpdateScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = typeof params.id === "string" ? params.id : "";

  const [lang, setLang] = useState<Lang>("en");
  const [range, setRange] = useState<Range>(7);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = COPY[lang];

  async function generate() {
    if (!patientId || busy) return;
    setBusy(true);
    setText("");
    setError(null);
    setDisclaimer(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${API_BASE}/api/family-update/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ patient_id: patientId, language: lang, date_range_days: range }),
      });
      if (!res.ok || !res.body) {
        setError(t.error);
        setBusy(false);
        return;
      }
      const reader = (res.body as ReadableStream).getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.kind === "meta") setDisclaimer(evt.disclaimer);
            else if (evt.kind === "text") {
              acc += evt.text;
              setText(acc);
            } else if (evt.kind === "error") setError(evt.message || t.error);
          } catch {
            // skip
          }
        }
      }
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert("", t.copied);
  }

  async function shareNative() {
    if (!text) return;
    try {
      await Share.share({ message: text });
    } catch {
      // dismissed
    }
  }

  async function whatsappShare() {
    if (!text) return;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      Linking.openURL(url);
    } else {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t.title}</Text>
      <Text style={styles.subtle}>{t.subhead}</Text>

      <View style={styles.controlsRow}>
        <View style={styles.toggle}>
          <ToggleButton active={lang === "en"} onPress={() => setLang("en")} label="English" />
          <ToggleButton active={lang === "es"} onPress={() => setLang("es")} label="Espanol" />
        </View>
      </View>

      <View style={styles.controlsRow}>
        {([7, 14, 30] as Range[]).map((r, i) => (
          <RangePill key={r} active={range === r} onPress={() => setRange(r)} label={t.range[i]} />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.generateBtn, busy && { opacity: 0.7 }]}
        onPress={generate}
        disabled={busy}
        accessibilityLabel="Generate update"
      >
        <Text style={styles.generateBtnText}>{busy ? t.generating : t.generate}</Text>
      </TouchableOpacity>

      {disclaimer && (
        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerText}>{disclaimer}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.outputCard}>
        {text || busy ? (
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            style={styles.textInput}
            accessibilityLabel="Family update text"
          />
        ) : (
          <Text style={styles.emptyText}>{t.empty}</Text>
        )}
      </View>

      {(text || busy) && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.button, styles.actionPrimary]} onPress={copy} accessibilityLabel={t.copy}>
            <Text style={styles.actionPrimaryText}>{t.copy}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.actionGhost]} onPress={shareNative} accessibilityLabel={t.share}>
            <Text style={styles.actionGhostText}>{t.share}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.actionAccent]} onPress={whatsappShare} accessibilityLabel={t.whatsapp}>
            <Text style={styles.actionAccentText}>{t.whatsapp}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function ToggleButton({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toggleBtn, active && { backgroundColor: tokens.primary }]}
      accessibilityLabel={label}
    >
      <Text style={[styles.toggleText, active && { color: tokens.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RangePill({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.rangePill, active && styles.rangePillActive]}
      accessibilityLabel={label}
    >
      <Text style={[styles.rangePillText, active && { color: tokens.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.background },
  content: { padding: 20, paddingBottom: 60 },
  heading: { fontSize: 24, color: tokens.primary, fontWeight: "700", marginBottom: 4 },
  subtle: { fontSize: 14, color: tokens.muted, marginBottom: 16 },
  controlsRow: { flexDirection: "row", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  toggle: { flexDirection: "row", borderWidth: 1, borderColor: tokens.border, borderRadius: 24, overflow: "hidden" },
  toggleBtn: { paddingHorizontal: 18, height: tokens.touchMin, justifyContent: "center", backgroundColor: tokens.card },
  toggleText: { fontSize: 14, color: tokens.text, fontWeight: "500" },
  rangePill: {
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.card,
  },
  rangePillActive: { backgroundColor: tokens.primary, borderColor: tokens.primary },
  rangePillText: { fontSize: 13, color: tokens.text, fontWeight: "500" },
  button: { borderRadius: 24, justifyContent: "center", alignItems: "center", paddingHorizontal: 18 },
  generateBtn: { backgroundColor: tokens.accent, height: tokens.touchMin, marginVertical: 12 },
  generateBtnText: { color: tokens.white, fontSize: 14, fontWeight: "600" },
  disclaimerBanner: {
    backgroundColor: tokens.paleTerra,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  disclaimerText: { color: tokens.muted, fontSize: 12 },
  errorBanner: {
    backgroundColor: tokens.paleTerra,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  errorText: { color: tokens.accent, fontSize: 14 },
  outputCard: {
    backgroundColor: tokens.card,
    borderRadius: tokens.radiusCard,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    minHeight: 220,
  },
  textInput: {
    minHeight: 240,
    textAlignVertical: "top",
    fontSize: 15,
    color: tokens.text,
    lineHeight: 22,
  },
  emptyText: { color: tokens.muted, fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" },
  actionPrimary: { backgroundColor: tokens.primary, height: tokens.touchMin },
  actionPrimaryText: { color: tokens.white, fontWeight: "600", fontSize: 14 },
  actionGhost: { backgroundColor: tokens.card, borderWidth: 1, borderColor: tokens.border, height: tokens.touchMin },
  actionGhostText: { color: tokens.text, fontWeight: "600", fontSize: 14 },
  actionAccent: { backgroundColor: tokens.accent, height: tokens.touchMin },
  actionAccentText: { color: tokens.white, fontWeight: "600", fontSize: 14 },
});
