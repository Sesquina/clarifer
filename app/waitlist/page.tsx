import type { Metadata } from "next";
import Image from "next/image";
import { WaitlistForm } from "@/components/waitlist-form";

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
      <div
        style={{
          width: "100%",
          maxWidth: 480,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Image
            src="/clarifer-logo.png"
            alt="Clarifer"
            width={40}
            height={40}
          />
        </div>

        <WaitlistForm />

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href="https://clarifer.com"
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
