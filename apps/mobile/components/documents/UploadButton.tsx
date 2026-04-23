import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/lib/supabase-client";

interface Props {
  patientId: string;
  onUploaded?: (documentId: string) => void;
}

export function UploadButton({ patientId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("patientId", patientId);
      formData.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream" } as unknown as Blob);

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const body = await res.json();
      onUploaded?.(body.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.button, uploading && styles.disabled]}
        onPress={handlePick}
        disabled={uploading}
        accessibilityLabel="Upload document"
      >
        {uploading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.label}>+ Upload Document</Text>
        }
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#2C5F4A", borderRadius: 10, padding: 14, alignItems: "center" },
  disabled: { opacity: 0.6 },
  label: { color: "#fff", fontWeight: "600", fontSize: 15 },
  error: { color: "#C0392B", fontSize: 13, marginTop: 8, textAlign: "center" },
});
