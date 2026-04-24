import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/__setup.ts"],
    globals: true,
    // Module-cache leaks across parallel workers cause intermittent timeouts
    // in the heavily-mocked API tests (@/lib/supabase/server, @/lib/cors, etc.).
    // Running files serially adds ~30s but keeps the suite deterministic.
    fileParallelism: false,
    exclude: [
      "**/node_modules/**",
      "**/e2e/**",
      "**/*.spec.ts",
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@mobile": resolve(__dirname, "apps/mobile"),
      // Stub native-only modules that vitest cannot parse (Flow syntax etc.).
      "expo-apple-authentication": resolve(__dirname, "tests/__stubs/expo-apple-authentication.ts"),
      "react-native": resolve(__dirname, "tests/__stubs/react-native.ts"),
    },
  },
});
