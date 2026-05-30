/**
 * app/onboarding/complete/page.tsx
 * Shown after /onboarding — requires disclaimer acceptance before entering the app.
 * Awaits POST /api/users/disclaimer and navigates to /home only on confirmed success.
 * Tables: users (via /api/users/disclaimer), audit_log (via API)
 * Auth: required (middleware protects this route)
 * HIPAA: No PHI in this file
 */
"use client";

import { useRouter } from "next/navigation";
import { DisclaimerModal } from "@/components/onboarding/DisclaimerModal";

export default function OnboardingCompletePage() {
  const router = useRouter();

  async function handleAccept() {
    const res = await fetch("/api/users/disclaimer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true }),
    });
    if (!res.ok) throw new Error("API error");
    router.push("/home");
  }

  return <DisclaimerModal onAccept={handleAccept} />;
}
