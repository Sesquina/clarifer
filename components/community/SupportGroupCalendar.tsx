"use client";
import { CCF_SUPPORT_GROUPS, sortSupportGroups, type SupportAudience, type SupportLanguage } from "@/lib/ccf/support-groups";

interface SupportGroupCalendarProps {
  role?: SupportAudience;
  language?: SupportLanguage;
}

export function SupportGroupCalendar({ role, language }: SupportGroupCalendarProps) {
  const groups = sortSupportGroups(CCF_SUPPORT_GROUPS, { role, language });

  return (
    <section aria-labelledby="support-groups-heading" className="space-y-3" data-testid="support-groups">
      <h2 id="support-groups-heading" className="font-heading text-lg text-primary">CCF support groups</h2>
      <ul className="space-y-3" role="list">
        {groups.map((g) => (
          <li
            key={g.id}
            data-group-id={g.id}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-heading text-base text-foreground">{g.name}</p>
              <span
                className="rounded-full px-2 py-1 text-xs font-medium"
                style={{ background: "var(--pale-sage, #F0F5F2)", color: "var(--primary)" }}
              >
                {g.language}
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{g.description}</p>
            <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {g.frequency} · {g.time} · {g.format}
            </p>
            <a
              href={g.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 48 }}
            >
              Learn more & register
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
