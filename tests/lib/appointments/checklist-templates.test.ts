/**
 * tests/lib/appointments/checklist-templates.test.ts
 * Pure-function tests for getPreVisitChecklist().
 * Tables: none.
 * Auth: none.
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI in fixtures.
 */
import { describe, it, expect } from "vitest";
import { getPreVisitChecklist } from "@/lib/appointments/checklist-templates";

describe("getPreVisitChecklist", () => {
  it("1. returns the cholangiocarcinoma oncology list when both match", () => {
    const items = getPreVisitChecklist("cholangiocarcinoma", "oncology");
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items.some((i) => i.text.includes("CA 19-9"))).toBe(true);
    expect(items.some((i) => i.text.includes("FGFR2"))).toBe(true);
    items.forEach((i) => expect(i.checked).toBe(false));
  });

  it("2. falls back to condition-default list when appointment_type does not match", () => {
    const items = getPreVisitChecklist("cholangiocarcinoma", "primary_care");
    // Generic cholangio list is shorter than the oncology one.
    expect(items.length).toBeLessThan(7);
    expect(items.some((i) => i.text.includes("CA 19-9"))).toBe(true);
  });

  it("3. returns dementia-neurology list for dementia + neurology", () => {
    const items = getPreVisitChecklist("dementia", "neurology");
    expect(items.some((i) => i.text.toLowerCase().includes("respite"))).toBe(true);
    expect(items.some((i) => i.text.toLowerCase().includes("advance care"))).toBe(true);
  });

  it("4. returns generic fallback for unknown condition", () => {
    const items = getPreVisitChecklist("unknown-condition", "oncology");
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.text.toLowerCase().includes("medication"))).toBe(true);
  });

  it("5. handles null inputs without throwing", () => {
    const items = getPreVisitChecklist(null, null);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("6. returns a fresh copy each call (mutating one does not affect the next)", () => {
    const a = getPreVisitChecklist("cholangiocarcinoma", "oncology");
    a[0].checked = true;
    const b = getPreVisitChecklist("cholangiocarcinoma", "oncology");
    expect(b[0].checked).toBe(false);
  });
});
