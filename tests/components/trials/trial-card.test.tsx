/**
 * tests/components/trials/trial-card.test.tsx
 * Vitest + Testing Library suite for the web trials page trial-card render and save interaction.
 * Tables: none (component is fetch-driven; backend is mocked at the global fetch boundary).
 * Auth: not exercised; component assumes the user is already authenticated.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. Tests use synthetic trial fixtures and patient ids.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "patient-1" }),
}));

const mockTrial = {
  source: "clinicaltrials.gov" as const,
  nct_id: "NCT00000001",
  title: "Plain Language Trial",
  phase: "Phase 2",
  status: "RECRUITING",
  location: "Boston, MA",
  brief_summary: "Brief.",
  external_url: "https://clinicaltrials.gov/study/NCT00000001",
  plain_language: {
    five_things_to_know: ["A", "B", "C", "D", "E"],
    possible_disqualifiers: ["Currently pregnant"],
    next_step: "Call the site coordinator listed on the trial page.",
  },
  saved: false,
};

describe("TrialCard (rendered via trials page)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/trials/search" && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              trials: [mockTrial],
              condition: "cancer",
              country: "United States",
              source: "all",
            }),
        });
      }
      if (typeof url === "string" && url.startsWith("/api/trials/saved")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ saves: [] }) });
      }
      if (url === "/api/trials/save" && init?.method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ save: { id: "s1" } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("1. renders plain-language requirements (5 things to know + disqualifier)", async () => {
    const { default: TrialsPage } = await import("@/app/(app)/patients/[id]/trials/page");
    render(<TrialsPage />);
    expect(await screen.findByText("Plain Language Trial")).toBeInTheDocument();
    expect(screen.getByText(/5 things to know/i)).toBeInTheDocument();
    for (const point of mockTrial.plain_language.five_things_to_know) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
    expect(screen.getByText(/Possible disqualifiers/i)).toBeInTheDocument();
    expect(screen.getByText(/Currently pregnant/i)).toBeInTheDocument();
    expect(screen.getByText(/Next step/i)).toBeInTheDocument();
  });

  it("2. save button POSTs to /api/trials/save and toggles to saved state", async () => {
    const { default: TrialsPage } = await import("@/app/(app)/patients/[id]/trials/page");
    render(<TrialsPage />);
    const saveBtn = await screen.findByRole("button", { name: /Save Plain Language Trial/i });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      const saveCall = fetchSpy.mock.calls.find(
        (c) => c[0] === "/api/trials/save" && c[1]?.method === "POST"
      );
      expect(saveCall).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Saved$/i })).toBeInTheDocument();
    });
  });

  it("3. external link points to the full trial record", async () => {
    const { default: TrialsPage } = await import("@/app/(app)/patients/[id]/trials/page");
    render(<TrialsPage />);
    const link = await screen.findByRole("link", { name: /Open full record/i });
    expect(link.getAttribute("href")).toBe("https://clinicaltrials.gov/study/NCT00000001");
    expect(link.getAttribute("target")).toBe("_blank");
  });
});
