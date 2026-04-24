"use client";
import { useMemo } from "react";
import type { BiomarkerRow } from "./BiomarkerTracker";

interface TrialSuggestion {
  id: string;
  nct: string;
  title: string;
  matchedBy: string;
}

interface BiomarkerTrialMatcherProps {
  biomarkers: BiomarkerRow[];
}

const TRIAL_LIBRARY: Array<{
  id: string;
  nct: string;
  title: string;
  matchers: Array<{ biomarker: string; statuses: string[] }>;
}> = [
  {
    id: "t-pemi",
    nct: "NCT04093362",
    title: "Pemigatinib for FGFR2+ cholangiocarcinoma",
    matchers: [{ biomarker: "fgfr2", statuses: ["positive"] }],
  },
  {
    id: "t-futi",
    nct: "NCT05156892",
    title: "Futibatinib for FGFR2 fusions",
    matchers: [{ biomarker: "fgfr2", statuses: ["positive"] }],
  },
  {
    id: "t-ivosidenib",
    nct: "NCT02989857",
    title: "Ivosidenib for IDH1-mutant cholangiocarcinoma",
    matchers: [{ biomarker: "idh1", statuses: ["positive"] }],
  },
  {
    id: "t-dtarget",
    nct: "NCT03834740",
    title: "Dabrafenib + trametinib in BRAF V600E biliary cancers",
    matchers: [{ biomarker: "braf", statuses: ["positive"] }],
  },
  {
    id: "t-larotrectinib",
    nct: "NCT02637687",
    title: "Larotrectinib for NTRK fusion tumors",
    matchers: [{ biomarker: "ntrk", statuses: ["positive"] }],
  },
  {
    id: "t-pembro-msi",
    nct: "NCT02628067",
    title: "Pembrolizumab for MSI-high tumors",
    matchers: [{ biomarker: "msi", statuses: ["positive"] }],
  },
];

export function BiomarkerTrialMatcher({ biomarkers }: BiomarkerTrialMatcherProps) {
  const suggestions: TrialSuggestion[] = useMemo(() => {
    const out: TrialSuggestion[] = [];
    for (const trial of TRIAL_LIBRARY) {
      for (const matcher of trial.matchers) {
        const hit = biomarkers.find((b) => {
          const type = b.biomarker_type.toLowerCase();
          return type.includes(matcher.biomarker) && matcher.statuses.includes(b.status);
        });
        if (hit) {
          out.push({ id: trial.id, nct: trial.nct, title: trial.title, matchedBy: hit.biomarker_type });
          break;
        }
      }
    }
    return out;
  }, [biomarkers]);

  if (suggestions.length === 0) return null;

  return (
    <section
      aria-labelledby="biomarker-trial-heading"
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--primary)", background: "var(--pale-sage, #F0F5F2)" }}
    >
      <h2 id="biomarker-trial-heading" className="font-heading text-lg text-primary">
        Trials matching this biomarker profile
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
        These trials are a starting point. Ask your oncologist about eligibility.
      </p>
      <ul className="mt-3 space-y-2" role="list">
        {suggestions.map((t) => (
          <li
            key={t.id}
            className="rounded-xl border border-border bg-card p-3 text-sm"
          >
            <p className="font-medium text-foreground">{t.title}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              Matched by {t.matchedBy}
            </p>
            <a
              href={`https://clinicaltrials.gov/study/${t.nct}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 48 }}
            >
              View on ClinicalTrials.gov
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
