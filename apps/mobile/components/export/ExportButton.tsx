import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from "react-native";
import { supabase } from "@/lib/supabase-client";
import { colors, radius, spacing, typography, touchTarget } from "@/lib/design-tokens";

interface ExportButtonProps {
  patientId: string;
  apiUrl?: string;
}

// Mobile export surface. Uses the same /api/export/pdf endpoint as the web
// client. Native file sharing (expo-sharing) is deferred to a follow-up
// sprint so we do not add a new native dependency in Sprint 8; for now the
// button downloads the PDF on web and opens the data URL for native preview.
export function ExportButton({ patientId, apiUrl }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);

  async function onExport() {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const base = apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "https://clarifer.com";
      const res = await fetch(`${base}/api/export/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ patient_id: patientId }),
      });
      if (!res.ok) {
        Alert.alert("Export failed", "We could not export this record. Please try again in a moment.");
        return;
      }
      const blob = await res.blob();
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `clarifer-${patientId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 =
          typeof btoa !== "undefined"
            ? btoa(binary)
            : (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => { toString(enc: string): string } } }).Buffer?.from(binary, "binary").toString("base64") ?? "";
        const dataUrl = `data:application/pdf;base64,${base64}`;
        const canOpen = await Linking.canOpenURL(dataUrl).catch(() => false);
        if (canOpen) {
          await Linking.openURL(dataUrl);
        } else {
          Alert.alert("PDF ready", "Your device cannot preview the PDF directly. Try exporting from the web app.");
        }
      }
    } catch {
      Alert.alert("Export failed", "We could not reach the server. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onExport}
      accessibilityRole="button"
      accessibilityLabel="Export patient summary as PDF"
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>Export PDF</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.minimum,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: colors.white, fontWeight: typography.weightSemibold, fontSize: typography.sizeBody },
});
