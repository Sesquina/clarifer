/**
 * Sprint 8 — Biomarker tracker renders + alerts.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BiomarkerTracker } from "@/components/biomarkers/BiomarkerTracker";
import { BiomarkerAlert } from "@/components/biomarkers/BiomarkerAlert";

describe("BiomarkerTracker", () => {
  it("FGFR2 positive → shows pemigatinib alert", () => {
    render(
      <BiomarkerAlert
        biomarkers={[
          { biomarker_type: "FGFR2 fusion", status: "positive", value: "FGFR2-BICC1" },
        ]}
        oncologistName="Sarah Chen"
      />
    );
    expect(screen.getByRole("alert").textContent).toMatch(/pemigatinib/i);
    expect(screen.getByRole("alert").textContent).toMatch(/Dr\.?\s*Sarah Chen/i);
  });

  it("all not_tested → shows screening reminder", () => {
    render(
      <BiomarkerAlert
        biomarkers={[
          { biomarker_type: "FGFR2 fusion", status: "not_tested" },
          { biomarker_type: "IDH1 mutation", status: "not_tested" },
        ]}
      />
    );
    expect(screen.getByRole("alert").textContent).toMatch(/comprehensive molecular profiling/i);
  });

  it("negative status → green check badge", () => {
    render(
      <BiomarkerTracker
        biomarkers={[
          { id: "b1", biomarker_type: "IDH1 mutation", status: "negative" },
        ]}
      />
    );
    expect(screen.getByText("Negative")).toBeInTheDocument();
    expect(screen.getByText("IDH1 mutation")).toBeInTheDocument();
  });
});
