import Link from "next/link";

interface AppHeaderProps {
  userName?: string | null;
}

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "var(--background)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <img src="/clarifer-logo.png" alt="Clarifer" width={32} height={32} />
        <span style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--primary)",
        }}>
          Clarifer
        </span>
      </Link>
      {userName && (
        <span style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: 14,
          color: "var(--muted)",
        }}>
          {userName}
        </span>
      )}
    </header>
  );
}
