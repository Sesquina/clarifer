"use client";
import { useMemo, useState } from "react";

interface NutritionGuidanceProps {
  medications?: Array<{ name: string }>;
  postSurgery?: boolean;
}

interface NutritionTip {
  id: string;
  text: string;
  phase: "chemo" | "post-surgery" | "general";
}

const CHEMO_TIPS: NutritionTip[] = [
  { id: "c1", phase: "chemo", text: "Small, frequent meals (5-6 per day) are easier to tolerate." },
  { id: "c2", phase: "chemo", text: "High-protein foods help maintain strength." },
  { id: "c3", phase: "chemo", text: "Ginger tea or ginger chews can help with nausea." },
  { id: "c4", phase: "chemo", text: "Cold or room-temperature foods may be better tolerated." },
  { id: "c5", phase: "chemo", text: "Stay hydrated -- aim for 8+ cups of water daily." },
  { id: "c6", phase: "chemo", text: "Avoid strong smells on chemo days." },
];

const POST_SURGERY_TIPS: NutritionTip[] = [
  { id: "s1", phase: "post-surgery", text: "Soft, easily digestible foods for the first 2 weeks." },
  { id: "s2", phase: "post-surgery", text: "Small meals to reduce strain on the liver." },
  { id: "s3", phase: "post-surgery", text: "Avoid high-fat foods initially." },
];

const GENERAL_TIPS: NutritionTip[] = [
  { id: "g1", phase: "general", text: "Weight loss is common -- track weekly." },
  { id: "g2", phase: "general", text: "Talk to an oncology dietician if appetite drops." },
  { id: "g3", phase: "general", text: "Some supplements can interfere with treatment -- always ask your oncologist first." },
];

const CHEMO_DRUGS = ["gemcitabine", "cisplatin", "carboplatin", "fluorouracil", "capecitabine", "oxaliplatin", "paclitaxel"];

export function NutritionGuidance({ medications = [], postSurgery = false }: NutritionGuidanceProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const onChemo = useMemo(() => {
    const names = medications.map((m) => m.name.toLowerCase());
    return names.some((n) => CHEMO_DRUGS.some((d) => n.includes(d)));
  }, [medications]);

  const tips: NutritionTip[] = useMemo(() => {
    const list: NutritionTip[] = [];
    if (onChemo) list.push(...CHEMO_TIPS);
    if (postSurgery) list.push(...POST_SURGERY_TIPS);
    list.push(...GENERAL_TIPS);
    return list.filter((t) => !dismissed.has(t.id));
  }, [onChemo, postSurgery, dismissed]);

  return (
    <section aria-labelledby="nutrition-heading" className="space-y-3">
      <header>
        <h2 id="nutrition-heading" className="font-heading text-lg text-primary">Nutrition notes</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Gentle suggestions tailored to where you are in treatment.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2" role="list">
        {tips.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm"
          >
            <span>{t.text}</span>
            <button
              type="button"
              onClick={() => setDismissed((prev) => {
                const next = new Set(prev); next.add(t.id); return next;
              })}
              aria-label="Dismiss tip"
              className="rounded-full border px-2 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", minHeight: 32, minWidth: 32 }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <footer
        className="rounded-xl border px-4 py-3 text-xs"
        style={{ borderColor: "var(--border)", background: "var(--pale-sage, #F0F5F2)", color: "var(--foreground)" }}
      >
        These tips are from CCF's nutrition guide. Always confirm with your oncology dietician.{" "}
        <a
          href="https://www.cholangiocarcinoma.org/nutrition-and-cholangiocarcinoma/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "var(--primary)" }}
        >
          Read the full guide
        </a>
        .
      </footer>
    </section>
  );
}
