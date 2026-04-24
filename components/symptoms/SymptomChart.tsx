"use client";
import { useMemo, useState } from "react";

/**
 * Pure-SVG line chart so the same component renders on web (Next.js) and
 * mobile (React Native via react-native-svg, which exports the same primitive
 * shapes). No chart library — avoids victory-native's Expo SDK 55 issues.
 */

export interface SymptomPoint {
  date: string;
  symptom_key: string;
  value: number;
}

interface SymptomChartProps {
  points: SymptomPoint[];
  days?: 7 | 30 | 90;
  width?: number;
  height?: number;
}

const COLOR_TOKENS: Record<string, string> = {
  pain_level: "var(--terracotta)",
  fatigue: "var(--primary)",
  nausea: "var(--muted-foreground)",
  overall_severity: "var(--primary)",
};
const FALLBACK_PALETTE = [
  "var(--terracotta)",
  "var(--primary)",
  "var(--muted-foreground)",
];

function colorFor(key: string, index: number): string {
  return COLOR_TOKENS[key] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export function SymptomChart({
  points,
  days = 30,
  width = 560,
  height = 220,
}: SymptomChartProps) {
  const [hover, setHover] = useState<SymptomPoint | null>(null);

  const { series, xLabels, pathByKey, dotByKey } = useMemo(() => {
    if (points.length === 0) {
      return {
        series: [] as string[],
        xLabels: [] as string[],
        pathByKey: {} as Record<string, string>,
        dotByKey: {} as Record<string, Array<{ cx: number; cy: number; point: SymptomPoint }>>,
      };
    }

    const pad = { top: 24, right: 16, bottom: 28, left: 36 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const datesSet = new Set(points.map((p) => p.date));
    const dates = Array.from(datesSet).sort();
    const minX = 0;
    const maxX = Math.max(1, dates.length - 1);

    const minY = 1;
    const maxY = 10;

    const groupedByKey = new Map<string, SymptomPoint[]>();
    for (const p of points) {
      const arr = groupedByKey.get(p.symptom_key) ?? [];
      arr.push(p);
      groupedByKey.set(p.symptom_key, arr);
    }

    const pathByKey: Record<string, string> = {};
    const dotByKey: Record<string, Array<{ cx: number; cy: number; point: SymptomPoint }>> = {};

    for (const [key, rows] of groupedByKey.entries()) {
      const sorted = rows.slice().sort((a, b) => a.date.localeCompare(b.date));
      const coords = sorted.map((row) => {
        const xIndex = dates.indexOf(row.date);
        const x = pad.left + (xIndex / Math.max(1, maxX - minX)) * innerW;
        const y = pad.top + (1 - (row.value - minY) / Math.max(1, maxY - minY)) * innerH;
        return { x, y, row };
      });
      pathByKey[key] = coords
        .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
        .join(" ");
      dotByKey[key] = coords.map((c) => ({ cx: c.x, cy: c.y, point: c.row }));
    }

    const step = Math.max(1, Math.floor(dates.length / 5));
    const xLabels = dates.filter((_, i) => i % step === 0 || i === dates.length - 1);

    return {
      series: Array.from(groupedByKey.keys()),
      xLabels,
      pathByKey,
      dotByKey,
    };
  }, [points, width, height]);

  if (points.length === 0) {
    return (
      <div
        role="region"
        aria-label="Symptom chart"
        data-testid="symptom-chart-empty"
        className="rounded-xl border border-border bg-pale-sage p-8 text-center"
        style={{ backgroundColor: "var(--pale-sage, var(--muted))" }}
      >
        <p className="font-heading text-lg text-primary">No symptom data yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Start tracking symptoms to see trends over time.
        </p>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Symptom chart, last ${days} days`}
      data-testid="symptom-chart"
      className="rounded-xl border border-border bg-card p-4"
    >
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="presentation">
        <line
          x1={36}
          x2={width - 16}
          y1={height - 28}
          y2={height - 28}
          stroke="var(--border)"
          strokeWidth={1}
        />
        <line
          x1={36}
          x2={36}
          y1={24}
          y2={height - 28}
          stroke="var(--border)"
          strokeWidth={1}
        />

        {[1, 5, 10].map((tick) => {
          const y = 24 + (1 - (tick - 1) / 9) * (height - 28 - 24);
          return (
            <g key={tick}>
              <text
                x={30}
                y={y + 4}
                fontSize={10}
                textAnchor="end"
                fill="var(--muted-foreground)"
              >
                {tick}
              </text>
              <line x1={36} x2={width - 16} y1={y} y2={y} stroke="var(--border)" strokeOpacity={0.4} />
            </g>
          );
        })}

        {series.map((key, idx) => (
          <g key={key}>
            <path
              d={pathByKey[key]}
              fill="none"
              stroke={colorFor(key, idx)}
              strokeWidth={2}
            />
            {dotByKey[key].map((d, i) => (
              <circle
                key={`${key}-${i}`}
                cx={d.cx}
                cy={d.cy}
                r={hover === d.point ? 5 : 3}
                fill={colorFor(key, idx)}
                onMouseEnter={() => setHover(d.point)}
                onMouseLeave={() => setHover(null)}
                aria-label={`${key} on ${d.point.date}: ${d.point.value}`}
              />
            ))}
          </g>
        ))}

        {xLabels.map((d) => {
          const i = Array.from(new Set(points.map((p) => p.date))).sort().indexOf(d);
          const x = 36 + (i / Math.max(1, xLabels.length)) * (width - 52);
          return (
            <text
              key={d}
              x={x}
              y={height - 12}
              fontSize={10}
              textAnchor="middle"
              fill="var(--muted-foreground)"
            >
              {d.slice(5)}
            </text>
          );
        })}
      </svg>

      {hover && (
        <div
          className="mt-2 text-sm text-foreground"
          role="status"
          aria-live="polite"
        >
          <span className="font-medium">{hover.symptom_key}</span>{" "}
          <span className="text-muted-foreground">· {hover.date}</span>{" "}
          <span>· {hover.value}/10</span>
        </div>
      )}
    </div>
  );
}
