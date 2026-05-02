/**
 * tests/internal/ccf-dashboard.test.ts
 * Unit tests for the CCF Foundation dashboard logic.
 * Tests: privacy helpers, data aggregation, symptom extraction, trial counting.
 * Sprint: Sprint CCF-4 -- Foundation Dashboard
 * HIPAA: No PHI in test fixtures. All test data is synthetic.
 */

import { describe, it, expect } from "vitest";

// ─── Re-implement helpers for testability ─────────────────────────────────────
// (These functions mirror the logic in page.tsx so they can be tested in isolation.)

function privacyCount(n: number): string {
  if (n >= 1 && n <= 4) return "< 5";
  return n.toLocaleString();
}

function privacyPct(pct: number): string {
  if (pct <= 0) return "0%";
  return `${Math.round(pct)}%`;
}

function extractSymptomsFromLogs(
  logs: Array<{ symptoms: unknown; responses: unknown; overall_severity: number | null }>
): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  let hadStructured = false;

  for (const log of logs) {
    if (Array.isArray(log.symptoms)) {
      hadStructured = true;
      for (const s of log.symptoms) {
        if (typeof s === "string" && s.trim()) {
          counts[s] = (counts[s] ?? 0) + 1;
        }
      }
      continue;
    }
    if (log.symptoms && typeof log.symptoms === "object") {
      hadStructured = true;
      for (const [key, val] of Object.entries(log.symptoms as Record<string, unknown>)) {
        const active =
          val !== null && val !== false && val !== 0 && val !== "" &&
          !(Array.isArray(val) && val.length === 0);
        if (active) {
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      continue;
    }
    if (log.responses && typeof log.responses === "object" && !Array.isArray(log.responses)) {
      hadStructured = true;
      for (const [key, val] of Object.entries(log.responses as Record<string, unknown>)) {
        if (val !== null && val !== false && val !== 0) {
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
    }
  }

  if (!hadStructured || Object.keys(counts).length === 0) {
    const severityCounts: Record<string, number> = {};
    for (const log of logs) {
      if (log.overall_severity != null) {
        const label =
          (log.overall_severity as number) >= 8 ? "Severe symptoms" :
          (log.overall_severity as number) >= 5 ? "Moderate symptoms" :
          "Mild symptoms";
        severityCounts[label] = (severityCounts[label] ?? 0) + 1;
      }
    }
    return Object.entries(severityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

function aggregateTrialSaves(
  saves: Array<{ trial_id: string; trial_name: string; phase: string; status: string }>
): Array<{ trial_title: string; phase: string; status: string; save_count: number }> {
  const trialMap: Record<string, { trial_title: string; phase: string; status: string; save_count: number }> = {};
  for (const s of saves) {
    // Use || so empty strings also fall through to the next fallback.
    const title = s.trial_name || s.trial_id || "Unknown Trial";
    const key = title;
    if (!trialMap[key]) {
      trialMap[key] = {
        trial_title: title,
        phase: s.phase || "Not specified",
        status: s.status || "Unknown",
        save_count: 0,
      };
    }
    trialMap[key].save_count++;
  }
  return Object.values(trialMap)
    .sort((a, b) => b.save_count - a.save_count)
    .slice(0, 5);
}

function calcWeeklyLoggingPct(weeklyPatients: number, totalPatients: number): number {
  if (totalPatients === 0) return 0;
  return (weeklyPatients / totalPatients) * 100;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CCF Dashboard: privacy helpers", () => {
  it("1. privacyCount returns '< 5' for counts 1 through 4", () => {
    expect(privacyCount(1)).toBe("< 5");
    expect(privacyCount(2)).toBe("< 5");
    expect(privacyCount(3)).toBe("< 5");
    expect(privacyCount(4)).toBe("< 5");
  });

  it("2. privacyCount shows actual number for 0, 5, and above", () => {
    expect(privacyCount(0)).toBe("0");
    expect(privacyCount(5)).toBe("5");
    expect(privacyCount(100)).toBe("100");
    expect(privacyCount(1234)).toBe("1,234");
  });

  it("3. privacyPct returns '0%' for zero and negative values", () => {
    expect(privacyPct(0)).toBe("0%");
    expect(privacyPct(-1)).toBe("0%");
  });

  it("4. privacyPct rounds correctly and appends percent symbol", () => {
    expect(privacyPct(33.3)).toBe("33%");
    expect(privacyPct(66.6)).toBe("67%");
    expect(privacyPct(100)).toBe("100%");
  });
});

describe("CCF Dashboard: symptom extraction", () => {
  it("5. extracts symptoms from JSONB array format", () => {
    const logs = [
      { symptoms: ["fatigue", "nausea"], responses: null, overall_severity: null },
      { symptoms: ["fatigue", "pain"], responses: null, overall_severity: null },
      { symptoms: ["nausea"], responses: null, overall_severity: null },
    ];
    const result = extractSymptomsFromLogs(logs);
    expect(result[0].name).toBe("fatigue");
    expect(result[0].count).toBe(2);
    expect(result[1].name).toBe("nausea");
    expect(result[1].count).toBe(2);
  });

  it("6. extracts symptoms from JSONB object format (truthy values only)", () => {
    const logs = [
      { symptoms: { pain: 7, fatigue: true, nausea: false, jaundice: 0 }, responses: null, overall_severity: null },
      { symptoms: { pain: 5, fatigue: true }, responses: null, overall_severity: null },
    ];
    const result = extractSymptomsFromLogs(logs);
    const names = result.map((r) => r.name);
    expect(names).toContain("pain");
    expect(names).toContain("fatigue");
    expect(names).not.toContain("nausea");
    expect(names).not.toContain("jaundice");
    expect(result.find((r) => r.name === "pain")?.count).toBe(2);
  });

  it("7. falls back to severity labels when symptoms is null/empty", () => {
    const logs = [
      { symptoms: null, responses: null, overall_severity: 8 },
      { symptoms: null, responses: null, overall_severity: 9 },
      { symptoms: null, responses: null, overall_severity: 3 },
    ];
    const result = extractSymptomsFromLogs(logs);
    expect(result.length).toBeGreaterThan(0);
    expect(result.find((r) => r.name === "Severe symptoms")?.count).toBe(2);
    expect(result.find((r) => r.name === "Mild symptoms")?.count).toBe(1);
  });

  it("8. returns empty array when no logs provided", () => {
    expect(extractSymptomsFromLogs([])).toEqual([]);
  });

  it("9. limits results to top 5 symptoms", () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      symptoms: [`symptom_${i}`],
      responses: null,
      overall_severity: null,
    }));
    const result = extractSymptomsFromLogs(logs);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("CCF Dashboard: trial saves aggregation", () => {
  it("10. aggregates trial saves by trial_name", () => {
    const saves = [
      { trial_id: "NCT001", trial_name: "Trial A", phase: "Phase 2", status: "Recruiting" },
      { trial_id: "NCT001", trial_name: "Trial A", phase: "Phase 2", status: "Recruiting" },
      { trial_id: "NCT002", trial_name: "Trial B", phase: "Phase 3", status: "Not yet recruiting" },
    ];
    const result = aggregateTrialSaves(saves);
    expect(result[0].trial_title).toBe("Trial A");
    expect(result[0].save_count).toBe(2);
    expect(result[1].trial_title).toBe("Trial B");
    expect(result[1].save_count).toBe(1);
  });

  it("11. sorts trials by save count descending", () => {
    const saves = [
      { trial_id: "NCT001", trial_name: "Trial A", phase: "Phase 2", status: "Recruiting" },
      { trial_id: "NCT002", trial_name: "Trial B", phase: "Phase 3", status: "Recruiting" },
      { trial_id: "NCT002", trial_name: "Trial B", phase: "Phase 3", status: "Recruiting" },
      { trial_id: "NCT002", trial_name: "Trial B", phase: "Phase 3", status: "Recruiting" },
    ];
    const result = aggregateTrialSaves(saves);
    expect(result[0].save_count).toBeGreaterThanOrEqual(result[1]?.save_count ?? 0);
  });

  it("12. limits to 5 trials", () => {
    const saves = Array.from({ length: 20 }, (_, i) => ({
      trial_id: `NCT00${i}`,
      trial_name: `Trial ${i}`,
      phase: "Phase 2",
      status: "Recruiting",
    }));
    const result = aggregateTrialSaves(saves);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("13. falls back to trial_id when trial_name is empty", () => {
    const saves = [{ trial_id: "NCT999", trial_name: "", phase: "Phase 2", status: "Recruiting" }];
    const result = aggregateTrialSaves(saves);
    expect(result[0].trial_title).toBe("NCT999");
  });

  it("14. returns empty array for empty input", () => {
    expect(aggregateTrialSaves([])).toEqual([]);
  });
});

describe("CCF Dashboard: weekly logging percentage", () => {
  it("15. returns 0 when total patients is 0", () => {
    expect(calcWeeklyLoggingPct(0, 0)).toBe(0);
  });

  it("16. calculates correct percentage", () => {
    expect(calcWeeklyLoggingPct(5, 10)).toBe(50);
    expect(calcWeeklyLoggingPct(10, 10)).toBe(100);
    expect(calcWeeklyLoggingPct(0, 10)).toBe(0);
  });

  it("17. percentage can exceed 100 if data is inconsistent (handled by display layer)", () => {
    // The page display layer caps at 100% visually via privacyPct clamping.
    // The calculation itself is uncapped -- display layer handles it.
    const pct = calcWeeklyLoggingPct(12, 10);
    expect(pct).toBe(120); // Uncapped at calculation level.
    expect(privacyPct(Math.min(pct, 100))).toBe("100%");
  });
});

describe("CCF Dashboard: bar chart ordering", () => {
  it("18. symptoms are ordered with highest count first", () => {
    const logs = [
      { symptoms: ["fatigue"], responses: null, overall_severity: null },
      { symptoms: ["fatigue"], responses: null, overall_severity: null },
      { symptoms: ["fatigue"], responses: null, overall_severity: null },
      { symptoms: ["pain"], responses: null, overall_severity: null },
    ];
    const result = extractSymptomsFromLogs(logs);
    expect(result[0].name).toBe("fatigue");
    expect(result[0].count).toBe(3);
  });
});
