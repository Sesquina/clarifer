import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        backgroundColor: "#FAF7F2",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#2C5F4A" strokeWidth="2" width={48} height={48} style={{ margin: "0 auto" }}>
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="8" x2="12" y2="22" />
          <path d="M5 15l7 7 7-7" />
          <path d="M5 12h4M15 12h4" />
        </svg>
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 32,
            color: "#1A1A1A",
            marginTop: 24,
          }}
        >
          Page not found
        </h1>
        <p style={{ fontSize: 16, color: "#6B6B6B", marginTop: 8, lineHeight: 1.6 }}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 48,
            padding: "0 28px",
            borderRadius: 24,
            backgroundColor: "#2C5F4A",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            marginTop: 24,
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
