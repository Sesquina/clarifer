/**
 * app/waitlist/page.tsx
 * Public marketing page -- Brevo waitlist embed.
 * No auth, no sidebar, no app nav.
 * Mobile exception: confirmed by Samira (web-only marketing page).
 */
import type { Metadata } from "next";
import Image from "next/image";
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
      <div style={{ width: "100%", maxWidth: 480 }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Image
            src="/clarifer-logo.png"
            alt="Clarifer"
            width={40}
            height={40}
          />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--primary)",
            textAlign: "center",
            marginBottom: 12,
            lineHeight: 1.25,
          }}
        >
          Join the Clarifer waitlist
        </h1>

        <p
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 15,
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          Enter your details and we will notify you when Clarifer launches.
        </p>

        <BrevoFormEmbed />

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a
            href="/"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 13,
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            Learn more about Clarifer
          </a>
        </div>

      </div>
    </main>
  );
}
