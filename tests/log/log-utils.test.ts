/**
 * tests/log/log-utils.test.ts
 * Unit tests for computeInsight and formatLogDate utility functions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeInsight, formatLogDate } from "@/app/log/page";

interface LogStub {
  id: string;
  overall_severity: number;
  created_at: string;
  responses?: Record<string, unknown> | null;
}

function makeLog(severity: number, daysAgo = 0): LogStub {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id: `log-${severity}-${daysAgo}`, overall_severity: severity, created_at: d.toISOString() };
}

describe("computeInsight", () => {
  it("1. returns 'keep going' message when fewer than 3 logs", () => {
    expect(computeInsight([])).toMatch(/Keep going/);
    expect(computeInsight([makeLog(1)])).toMatch(/Keep going/);
    expect(computeInsight([makeLog(2), makeLog(3)])).toMatch(/Keep going/);
  });

  it("2. returns null when 3 logs all have severity < 3", () => {
    expect(computeInsight([makeLog(1), makeLog(2), makeLog(2)])).toBeNull();
  });

  it("3. returns null when only 1 of 3 logs has severity >= 3", () => {
    expect(computeInsight([makeLog(3), makeLog(1), makeLog(2)])).toBeNull();
  });

  it("4. returns trend message when 2+ logs have severity >= 3", () => {
    const result = computeInsight([makeLog(4), makeLog(3), makeLog(1)]);
    expect(result).not.toBeNull();
    expect(result).toMatch(/2 days at level/);
    expect(result).toMatch(/Worth flagging/);
  });

  it("5. uses the minimum elevated severity in the trend message", () => {
    const result = computeInsight([makeLog(5), makeLog(3), makeLog(1)]);
    expect(result).toMatch(/level 3/);
  });

  it("6. returns trend when all 3 logs are elevated", () => {
    const result = computeInsight([makeLog(4), makeLog(3), makeLog(5)]);
    expect(result).toMatch(/3 days at level/);
  });
});

describe("formatLogDate", () => {
  const RealDate = Date;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("7. returns 'Today' for a timestamp from today", () => {
    expect(formatLogDate("2026-06-19T08:00:00Z")).toBe("Today");
  });

  it("8. returns 'Yesterday' for a timestamp from yesterday", () => {
    expect(formatLogDate("2026-06-18T10:00:00Z")).toBe("Yesterday");
  });

  it("9. returns formatted date for older timestamps", () => {
    const result = formatLogDate("2026-06-15T10:00:00Z");
    // Should include the day of week (Mon) and date
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    expect(result).toMatch(/Jun/);
  });
});
