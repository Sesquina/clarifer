import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "You are all set — Clarifer",
};

export default function OnboardingCompletePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Image
            src="/clarifer-logo.png"
            alt="Clarifer"
            width={48}
            height={48}
          />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--primary)",
            marginBottom: 12,
            lineHeight: 1.25,
          }}
        >
          You are all set.
        </h1>

        <p
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 16,
            color: "var(--muted)",
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          What do you want to do first?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Link
            href="/documents/upload"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 56,
              borderRadius: 26,
              backgroundColor: "var(--primary)",
              color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Upload your first document
          </Link>

          <Link
            href="/chat"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 56,
              borderRadius: 26,
              border: "1.5px solid var(--primary)",
              backgroundColor: "transparent",
              color: "var(--primary)",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ask Clarifer a question
          </Link>

          <Link
            href="/home"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: 14,
              color: "var(--muted)",
              textDecoration: "none",
            }}
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
