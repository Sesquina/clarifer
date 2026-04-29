/**
 * tests/components/export/export-button.test.tsx
 * Tests for the web ExportPDFButton.
 * Tables: none (component is fetch-driven).
 * Sprint: Sprint 13 -- Hospital-Grade PDF Export
 *
 * HIPAA: No PHI; synthetic ids only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ExportPDFButton } from "@/components/export/ExportPDFButton";

beforeEach(() => {
  vi.restoreAllMocks();
  // jsdom does not provide URL.createObjectURL by default.
  if (typeof URL.createObjectURL !== "function") {
    Object.assign(URL, { createObjectURL: () => "blob:fake" });
  } else {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
  }
  if (typeof URL.revokeObjectURL !== "function") {
    Object.assign(URL, { revokeObjectURL: () => undefined });
  } else {
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  }
});

describe("ExportPDFButton (web)", () => {
  it("78. renders with the default label", () => {
    render(<ExportPDFButton patientId="pat-1" callerRole="caregiver" />);
    expect(screen.getByRole("button", { name: /export pdf report/i })).toBeInTheDocument();
  });

  it("79. shows loading state on click", async () => {
    let resolveFetch: (v: Response) => void = () => undefined;
    const pending = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));
    render(<ExportPDFButton patientId="pat-1" callerRole="caregiver" />);
    fireEvent.click(screen.getByRole("button", { name: /export pdf report/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /generating report/i })).toBeInTheDocument();
    });
    // Resolve the pending fetch to clean up
    resolveFetch(
      new Response(new Blob(["pdf"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      })
    );
  });

  it("80. shows error state when the server rejects the export", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );
    render(<ExportPDFButton patientId="pat-1" callerRole="caregiver" />);
    fireEvent.click(screen.getByRole("button", { name: /export pdf report/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/export failed/i);
    });
  });

  it("81. triggers a download (anchor click) on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Blob(["pdf"], { type: "application/pdf" }), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="clarifer-pat-1-2026-04-28.pdf"',
          },
        })
      )
    );
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<ExportPDFButton patientId="pat-1" callerRole="caregiver" />);
    fireEvent.click(screen.getByRole("button", { name: /export pdf report/i }));
    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
