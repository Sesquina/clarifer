/**
 * SessionTimeout.tsx
 * Client component that signs the user out after 30 minutes of inactivity.
 * Tables: none (calls supabase.auth.signOut)
 * Auth: mounted inside (platform) layout -- runs for every authenticated route
 * Sprint: S14 -- fix/session-timeout
 * HIPAA: enforces the 30-minute web session timeout required by
 *        CLAUDE.md Section 3 ("Session timeout: web 30-60 min, mobile 15 min").
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
] as const;

export default function SessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const expire = async () => {
      await supabase.auth.signOut();
      router.replace("/login?reason=session_timeout");
    };

    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(expire, SESSION_TIMEOUT_MS);
    };

    reset();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, reset, { passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, reset);
      }
    };
  }, [router]);

  return null;
}
