// Metro resolves .web.ts for web builds and .native.ts for iOS/Android.
// This file is the Node/test fallback and re-exports from the native variant.
export { supabase } from "./supabase-client.native";
