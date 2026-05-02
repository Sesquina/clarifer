/**
 * app/internal/ccf/loading.tsx
 * Route-level loading skeleton for the CCF Foundation dashboard.
 * Shown by Next.js while the server component fetches Supabase data.
 * Sprint: Sprint CCF-4 -- Foundation Dashboard
 * HIPAA: No PHI in loading state.
 */

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};

function Skeleton({ height, style }: { height: number; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: "var(--pale-sage)",
        borderRadius: 14,
        height,
        ...style,
      }}
    />
  );
}

export default function CCFDashboardLoading() {
  return (
    <div style={BODY} aria-label="Loading CCF dashboard" aria-busy="true">
      {/* Header */}
      <div
        style={{
          backgroundColor: "var(--primary)",
          margin: "-32px -32px 0",
          height: 68,
          opacity: 0.9,
        }}
      />
      {/* Hero card */}
      <Skeleton height={160} style={{ marginTop: 32 }} />
      {/* Four metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 16, marginTop: 20 }}>
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </div>
      {/* Top symptoms */}
      <Skeleton height={220} style={{ marginTop: 20 }} />
      {/* Most saved trials */}
      <Skeleton height={280} style={{ marginTop: 20 }} />
      {/* Reach community */}
      <Skeleton height={180} style={{ marginTop: 20, marginBottom: 32 }} />
    </div>
  );
}
