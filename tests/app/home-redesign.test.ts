/**
 * tests/app/home-redesign.test.ts
 * Unit tests for home screen utility functions.
 * Tables: None
 * Auth: None
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { relativeTime, formatLogDate, getSeverityStyle } from "@/components/home/home-client";

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1. returns 'Today' for a timestamp from today", () => {
    expect(relativeTime("2026-06-19T08:00:00Z")).toBe("Today");
  });

  it("2. returns 'Yesterday' for a timestamp from yesterday", () => {
    expect(relativeTime("2026-06-18T10:00:00Z")).toBe("Yesterday");
  });

  it("3. returns 'N days ago' for older timestamps", () => {
    expect(relativeTime("2026-06-16T10:00:00Z")).toBe("3 days ago");
  });

  it("4. returns empty string for null", () => {
    expect(relativeTime(null)).toBe("");
  });
});

describe("formatLogDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("5. returns 'Today' for a timestamp from today", () => {
    expect(formatLogDate("2026-06-19T08:00:00Z")).toBe("Today");
  });

  it("6. returns 'Yesterday' for a timestamp from yesterday", () => {
    expect(formatLogDate("2026-06-18T10:00:00Z")).toBe("Yesterday");
  });

  it("7. returns weekday + month + day for older timestamps", () => {
    const result = formatLogDate("2026-06-15T10:00:00Z");
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/15/);
  });

  it("8. returns empty string for null", () => {
    expect(formatLogDate(null)).toBe("");
  });
});

describe("getSeverityStyle", () => {
  it("9. returns red style for severity >= 7", () => {
    const s7 = getSeverityStyle(7);
    expect(s7.border).toBe("#E24B4A");
    expect(s7.bg).toBe("#FCEBEB");
    expect(s7.text).toBe("#A32D2D");

    const s10 = getSeverityStyle(10);
    expect(s10.border).toBe("#E24B4A");
  });

  it("10. returns amber style for severity >= 4 and < 7", () => {
    const s4 = getSeverityStyle(4);
    expect(s4.border).toBe("#BA7517");
    expect(s4.bg).toBe("#FAEEDA");
    expect(s4.text).toBe("#633806");

    const s6 = getSeverityStyle(6);
    expect(s6.border).toBe("#BA7517");
  });

  it("11. returns green style for severity < 4", () => {
    const s3 = getSeverityStyle(3);
    expect(s3.border).toBe("#0F6E56");
    expect(s3.bg).toBe("#E1F5EE");
    expect(s3.text).toBe("#085041");

    const s0 = getSeverityStyle(0);
    expect(s0.border).toBe("#0F6E56");
  });
});
