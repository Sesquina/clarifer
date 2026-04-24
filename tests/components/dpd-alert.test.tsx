/**
 * Sprint 8 — DPD enzyme deficiency alert.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DPDAlert, isFluoropyrimidine } from "@/components/medications/DPDAlert";

describe("DPDAlert", () => {
  it("5-FU added → DPD alert appears", () => {
    render(
      <DPDAlert
        patientName="Carlos Rivera"
        medications={[{ name: "Fluorouracil" }]}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/DPD/);
    expect(alert.textContent).toMatch(/fluoropyrimidine/i);
  });

  it("both checkboxes checked → alert resolves", () => {
    render(
      <DPDAlert
        patientName="Carlos Rivera"
        medications={[{ name: "Capecitabine (Xeloda)" }]}
      />
    );
    const discussed = screen.getByLabelText(/discussed with oncologist/i) as HTMLInputElement;
    const completed = screen.getByLabelText(/DPD screening completed/i) as HTMLInputElement;
    fireEvent.click(discussed);
    fireEvent.click(completed);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(/confirmed/i);
  });

  it("no fluoropyrimidine → no alert", () => {
    const { container } = render(
      <DPDAlert
        patientName="Carlos Rivera"
        medications={[{ name: "Gemcitabine" }, { name: "Cisplatin" }]}
      />
    );
    expect(container.querySelector("[role=alert]")).toBeNull();
    expect(isFluoropyrimidine("gemcitabine")).toBe(false);
    expect(isFluoropyrimidine("fluorouracil")).toBe(true);
  });
});
