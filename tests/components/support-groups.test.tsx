/**
 * Sprint 8 — CCF support group calendar ordering.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupportGroupCalendar } from "@/components/community/SupportGroupCalendar";

describe("SupportGroupCalendar", () => {
  it("Spanish user → Puentes de Esperanza shown first", () => {
    render(<SupportGroupCalendar language="Spanish" role="caregiver" />);
    const list = screen.getByRole("list");
    const first = list.querySelectorAll("li")[0];
    expect(first.getAttribute("data-group-id")).toBe("ccf-puentes");
  });

  it("Caregiver role → caregiver-only group shown first in English", () => {
    render(<SupportGroupCalendar language="English" role="caregiver" />);
    const list = screen.getByRole("list");
    const first = list.querySelectorAll("li")[0];
    expect(first.getAttribute("data-group-id")).toBe("ccf-caregiver-group");
  });
});
