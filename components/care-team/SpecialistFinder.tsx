"use client";
import { useMemo, useState } from "react";
import { CCA_SPECIALISTS, filterSpecialists, type SpecialistCenter } from "@/lib/ccf/specialists";

interface SpecialistFinderProps {
  onAddToCareTeam?: (specialist: SpecialistCenter) => void;
}

export function SpecialistFinder({ onAddToCareTeam }: SpecialistFinderProps) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");

  const specialties = useMemo(() => {
    const all = new Set<string>();
    for (const s of CCA_SPECIALISTS) for (const sp of s.specialties) all.add(sp);
    return Array.from(all).sort();
  }, []);

  const results = useMemo(() => filterSpecialists(CCA_SPECIALISTS, { query, specialty }), [query, specialty]);

  return (
    <section aria-labelledby="specialist-finder-heading" className="space-y-4">
      <header>
        <h2 id="specialist-finder-heading" className="font-heading text-lg text-primary">CCA specialist finder</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Top cholangiocarcinoma centers in the US. These come from CCF's verified map.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-[220px]">
          <span className="sr-only">Search by city or state</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city or state"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--card)", minHeight: 48 }}
          />
        </label>
        <label>
          <span className="sr-only">Specialty</span>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--card)", minHeight: 48 }}
          >
            <option value="">All specialties</option>
            {specialties.map((sp) => <option key={sp} value={sp}>{sp}</option>)}
          </select>
        </label>
      </div>

      <ul className="space-y-2" role="list">
        {results.map((s) => (
          <li key={s.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-base text-foreground">{s.centerName}</p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{s.city}, {s.state}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.specialties.join(" · ")}</p>
              </div>
              {s.ccfVerified && (
                <span
                  className="rounded-full px-2 py-1 text-xs font-medium"
                  style={{ background: "var(--pale-sage, #F0F5F2)", color: "var(--primary)" }}
                >
                  CCF verified
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${s.phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", minHeight: 48 }}
              >
                Call {s.phone}
              </a>
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", minHeight: 48 }}
              >
                Visit site
              </a>
              {onAddToCareTeam && (
                <button
                  type="button"
                  onClick={() => onAddToCareTeam(s)}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 48 }}
                >
                  Add to care team
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        See the full specialist map on{" "}
        <a
          href="https://www.cholangiocarcinoma.org/find-a-specialist/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "var(--primary)" }}
        >
          cholangiocarcinoma.org
        </a>
        .
      </p>
    </section>
  );
}
