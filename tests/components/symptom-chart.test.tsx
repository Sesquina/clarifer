/**
 * Sprint 7 — SymptomChart.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SymptomChart } from "@/components/symptoms/SymptomChart";

function dates(n: number): string[] {
  const out: string[] = [];
  const base = new Date("2026-04-01");
  for (let i = 0; i < n; i += 1) {
    const d = new Date(base.getTime() + i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

describe("SymptomChart", () => {
  it("renders the warm empty state when no data is provided", () => {
    const { getByText, getByTestId } = render(<SymptomChart points={[]} days={30} />);
    expect(getByTestId("symptom-chart-empty")).toBeTruthy();
    expect(getByText(/no symptom data yet/i)).toBeTruthy();
    expect(getByText(/start tracking symptoms/i)).toBeTruthy();
  });

  it("renders the chart element when 30 days of data are provided", () => {
    const dd = dates(30);
    const points = dd.map((date, i) => ({
      date,
      symptom_key: "pain_level",
      value: (i % 10) + 1,
    }));
    const { getByTestId, container } = render(<SymptomChart points={points} days={30} />);
    expect(getByTestId("symptom-chart")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
    // At least one data point circle rendered
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("uses CSS variable tokens for line colors (no hard-coded hex)", () => {
    const points = [
      { date: "2026-04-01", symptom_key: "pain_level", value: 5 },
      { date: "2026-04-02", symptom_key: "fatigue", value: 6 },
    ];
    const { container } = render(<SymptomChart points={points} days={7} />);
    const paths = Array.from(container.querySelectorAll("path"));
    // Every path color should be a var(--...) token, not a literal hex string.
    for (const path of paths) {
      const stroke = path.getAttribute("stroke") ?? "";
      expect(stroke.startsWith("var(--")).toBe(true);
    }
  });
});
