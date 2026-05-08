/**
 * app/ccf-dashboard/layout.tsx
 * Standalone layout for the CCF Foundation dashboard.
 * Explicitly isolates this route from any parent layout that carries
 * a sidebar, nav, or sprint board. No internal command center chrome.
 * Auth: isAllowedEmail check is handled in page.tsx.
 * Sprint: fix/ccf-dashboard-standalone-and-flows
 * HIPAA: No PHI in this file.
 */

export default function CCFDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
