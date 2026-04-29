/**
 * tests/components/provider/patient-detail.test.tsx
 * Tests for the provider patient detail page (overview + notes +
 * export tabs).
 * Tables: none (page is fetch-driven; backend mocked at fetch).
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: No PHI; synthetic patient fixtures.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { use } from "react";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, use: vi.fn() };
});

import ProviderPatientDetail from "@/app/(app)/provider/patients/[id]/page";

const sampleData = {
  patient: {
    id: "pat-1",
    name: "Carlos Rivera",
    custom_diagnosis: "Cholangiocarcinoma",
    condition_template_id: "cholangiocarcinoma",
    diagnosis_date: "2025-09-01",
    dob: "1955-01-01",
  },
  symptom_logs: [{ id: "s1", created_at: "2026-04-25T00:00:00Z", overall_severity: 5 }],
  medications: [
    { id: "m1", name: "Capecitabine", dose: "1000", unit: "mg", frequency: "BID" },
  ],
  upcoming_appointments: [
    { id: "a1", title: "Oncology", datetime: "2026-05-15T10:00:00Z", appointment_type: "oncology" },
  ],
  recent_documents: [{ id: "d1", title: "Lab", summary: "CA 19-9 stable", created_at: null }],
  active_alerts: [],
  provider_notes: [],
};

describe("ProviderPatientDetail (web)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (use as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ id: "pat-1" });
  });

  it("57. Overview tab renders active medications", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(sampleData) })
    );
    render(<ProviderPatientDetail params={Promise.resolve({ id: "pat-1" })} />);
    await waitFor(() => expect(screen.getByText("Capecitabine")).toBeInTheDocument());
  });

  it("58. Notes tab shows the add-note form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(sampleData) })
    );
    render(<ProviderPatientDetail params={Promise.resolve({ id: "pat-1" })} />);
    await waitFor(() => expect(screen.getByText("Capecitabine")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: /notes/i }));
    expect(screen.getByLabelText(/note text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note type/i)).toBeInTheDocument();
  });

  it("59. Export button is present on the Export tab", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(sampleData) })
    );
    render(<ProviderPatientDetail params={Promise.resolve({ id: "pat-1" })} />);
    await waitFor(() => expect(screen.getByText("Capecitabine")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: /export/i }));
    expect(screen.getByRole("button", { name: /generate pdf report/i })).toBeInTheDocument();
  });
});
