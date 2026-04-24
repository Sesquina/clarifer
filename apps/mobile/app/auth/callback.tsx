import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase-client";

/**
 * Deep-link target for OAuth providers (Google, Apple) on native.
 * Supabase's onAuthStateChange fires SIGNED_IN once the session is persisted
 * by the SDK; at that point we route the user into the app.
 */
export default function AuthCallback() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/(home)/caregiver");
      } else if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // nothing to do
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#2C5F4A" />
      <Text style={styles.text}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  text: { marginTop: 12, color: "#2C5F4A", fontSize: 16 },
});
