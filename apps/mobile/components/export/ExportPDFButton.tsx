/**
 * apps/mobile/components/export/ExportPDFButton.tsx
 * Mobile PDF export button. Caregiver and provider variants share
 * one component; the route is selected via callerRole.
 * Tables: none (calls /api/export/pdf for caregivers,
 *         /api/provider/patients/[id]/export for providers).
 * Auth: passes Supabase Bearer token; server enforces role.
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export (replaces the
 *         Sprint 8 ExportButton; native flow now uses
 *         expo-file-system + expo-sharing).
 *
 * HIPAA: PDF blob is written to the app's cacheDirectory under a
 * patient-keyed filename, then handed to the OS share sheet via
 * expo-sharing. The on-device file is short-lived (cache directory
 * is purged by the OS) and never logged. Errors surface only generic
 * messages.
 *
 * MANUAL REQUIRED (Samira): in apps/mobile run `npx expo install
 * expo-file-system expo-sharing` before this component bundles.
 */
import { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "@/lib/supabase-client";
import {
  colors,
  radius,
  spacing,
  touchTarget,
  typography,
} from "@/lib/design-tokens";

export interface ExportPDFButtonProps {
  patientId: string;
  callerRole: "caregiver" | "provider";
  apiUrl?: string;
  label?: string;
}

export function ExportPDFButton({
  patientId,
  callerRole,
  apiUrl,
  label = "Export PDF",
}: ExportPDFButtonProps) {
  const [busy, setBusy] = useState(false);

  async function onExport() {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const base = apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "https://clarifer.com";
      const url =
        callerRole === "provider"
          ? `${base}/api/provider/patients/${encodeURIComponent(patientId)}/export`
          : `${base}/api/export/pdf`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:
          callerRole === "provider"
            ? undefined
            : JSON.stringify({ patient_id: patientId }),
      });
      if (!res.ok) {
        Alert.alert("Export failed", "We could not export this record. Please try again.");
        return;
      }

      if (Platform.OS === "web") {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `clarifer-${patientId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Native: write to cache dir, then hand off to share sheet.
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      const base64 =
        typeof btoa !== "undefined"
          ? btoa(binary)
          : (
              globalThis as unknown as {
                Buffer?: { from: (s: string, enc: string) => { toString(enc: string): string } };
              }
            ).Buffer?.from(binary, "binary").toString("base64") ?? "";
      const fileUri = `${FileSystem.cacheDirectory}clarifer-${patientId}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: "Share patient PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF saved", "The report was saved to your device cache.");
      }
    } catch {
      Alert.alert("Export failed", "We could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onExport}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
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
