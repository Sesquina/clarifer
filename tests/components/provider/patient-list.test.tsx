/**
 * tests/components/provider/patient-list.test.tsx
 * Tests for the provider portal home page (patient list, search,
 * empty state, alert badge).
 * Tables: none (page is fetch-driven; backend is mocked at the
 *         global fetch boundary).
 * Sprint: Sprint 12 -- Provider Portal
 *
 * HIPAA: No PHI; synthetic patient fixtures.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProviderHome from "@/app/(app)/provider/page";

const samplePatients = [
  {
    id: "pat-1",
    name: "Carlos Rivera",
    custom_diagnosis: "Cholangiocarcinoma",
    condition_template_id: "cholangiocarcinoma",
    last_symptom_log_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    next_appointment_at: "2026-05-15T10:00:00Z",
    medication_count: 5,
    active_alert_count: 2,
  },
  {
    id: "pat-2",
    name: "Diana Park",
    custom_diagnosis: "Stable, post-Whipple",
    condition_template_id: null,
    last_symptom_log_at: null,
    next_appointment_at: null,
    medication_count: 1,
    active_alert_count: 0,
  },
];

describe("ProviderHome (web)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("53. renders patient name and diagnosis", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ patients: samplePatients }),
      })
    );
    render(<ProviderHome />);
    await waitFor(() => {
      expect(screen.getByText("Carlos Rivera")).toBeInTheDocument();
    });
    expect(screen.getByText("Cholangiocarcinoma")).toBeInTheDocument();
  });

  it("54. shows alert badge when patient has active alerts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ patients: samplePatients }),
      })
    );
    render(<ProviderHome />);
    await waitFor(() => {
      expect(screen.getByLabelText(/2 active alerts/i)).toBeInTheDocument();
    });
  });

  it("55. shows warm empty state when no patients are assigned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ patients: [] }),
      })
    );
    render(<ProviderHome />);
    await waitFor(() => {
      expect(screen.getByLabelText("empty-state")).toBeInTheDocument();
      expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
    });
  });

  it("56. search filters by patient name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ patients: samplePatients }),
      })
    );
    render(<ProviderHome />);
    await waitFor(() => expect(screen.getByText("Carlos Rivera")).toBeInTheDocument());
    const search = screen.getByLabelText(/search patients/i);
    fireEvent.change(search, { target: { value: "Diana" } });
    expect(screen.queryByText("Carlos Rivera")).not.toBeInTheDocument();
    expect(screen.getByText("Diana Park")).toBeInTheDocument();
  });
});
