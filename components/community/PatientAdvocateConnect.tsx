"use client";

interface PatientAdvocateConnectProps {
  context?: "dashboard" | "checklist" | "emergency";
}

export function PatientAdvocateConnect({ context = "dashboard" }: PatientAdvocateConnectProps) {
  const compact = context === "checklist" || context === "emergency";

  return (
    <section
      aria-label="Connect with a CCF patient advocate"
      className="rounded-2xl border p-4"
      style={{
        borderColor: "var(--primary)",
        background: "var(--pale-sage, #F0F5F2)",
        color: "var(--foreground)",
      }}
    >
      <p className={`font-heading ${compact ? "text-base" : "text-lg"} text-primary`}>
        Talk to a CCF Patient Advocate -- free
      </p>
      {!compact && (
        <p className="mt-2 text-sm" style={{ color: "var(--foreground)" }}>
          CCF connects patients and caregivers with trained advocates who have personal experience with CCA.
          This is one of the most valuable resources available.
        </p>
      )}
      <a
        href="https://www.cholangiocarcinoma.org/connect-with-a-patient-advocate/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 48 }}
      >
        Schedule a free meeting
      </a>
    </section>
  );
}
