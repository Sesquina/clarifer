/**
 * app/waitlist/page.tsx
 * Public marketing page -- Brevo waitlist embed.
 * No auth, no sidebar, no app nav.
 * Mobile exception: confirmed by Samira (web-only marketing page).
 */
import type { Metadata } from "next";
import { BrevoFormEmbed } from "@/components/waitlist/BrevoFormEmbed";

export const metadata: Metadata = {
  title: "Join the Clarifer waitlist",
  description: "Sign up for early access to Clarifer.",
};

export default function WaitlistPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <BrevoFormEmbed />
    </main>
  );
}
