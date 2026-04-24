"use client";
import { useMemo, useState } from "react";
import { NewlyConnectedItem, WEEK_TITLES, buildChecklist } from "@/lib/ccf/newly-connected-template";

interface NewlyConnectedChecklistProps {
  initialItems?: NewlyConnectedItem[];
  onChange?: (items: NewlyConnectedItem[]) => void;
}

export function NewlyConnectedChecklist({ initialItems, onChange }: NewlyConnectedChecklistProps) {
  const [items, setItems] = useState<NewlyConnectedItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : buildChecklist()
  );

  const completed = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const grouped = useMemo(() => {
    const byWeek: Record<1 | 2 | 3 | 4, NewlyConnectedItem[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const i of items) byWeek[i.week].push(i);
    return byWeek;
  }, [items]);

  function toggle(id: string) {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
      onChange?.(next);
      return next;
    });
  }

  return (
    <section aria-labelledby="newly-connected-heading" className="space-y-4">
      <header>
        <h2 id="newly-connected-heading" className="font-heading text-lg text-primary">Your first 30 days</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          A gentle roadmap from the Cholangiocarcinoma Foundation. One step at a time.
        </p>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "var(--muted)" }}
          aria-label={`${pct} percent complete`}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)" }} />
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          {completed} of {total} complete
        </p>
      </header>

      {([1, 2, 3, 4] as const).map((week) => (
        <div key={week} className="rounded-2xl border border-border bg-card p-4">
          <p className="font-heading text-base text-primary">{WEEK_TITLES[week]}</p>
          <ul className="mt-3 space-y-2" role="list">
            {grouped[week].map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-3" style={{ minHeight: 48 }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggle(item.id)}
                    aria-label={item.label}
                    style={{ minHeight: 24, minWidth: 24, marginTop: 4 }}
                  />
                  <span className="flex-1 text-sm">
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={item.checked ? "line-through" : ""}
                        style={{
                          color: item.checked ? "var(--muted-foreground)" : "var(--foreground)",
                          textDecorationColor: "var(--muted-foreground)",
                        }}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span
                        className={item.checked ? "line-through" : ""}
                        style={{
                          color: item.checked ? "var(--muted-foreground)" : "var(--foreground)",
                          textDecorationColor: "var(--muted-foreground)",
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                    {item.helper && (
                      <span className="block text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {item.helper}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
