/**
 * tests/components/care-team/directory.test.tsx
 * Tests for the web Care Team directory page UI.
 * Tables: none (component is fetch-driven; backend is mocked at the global fetch boundary).
 * Auth: not exercised; component assumes authenticated session.
 * Sprint: Sprint 10 -- Care Team Directory
 *
 * HIPAA: No PHI. Tests use synthetic provider fixtures.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "patient-1" }),
}));

const sampleMember = {
  id: "ct-1",
  name: "Dr. Melissa Torres",
  role: "Oncologist",
  specialty: "Hepatobiliary",
  phone: "555-0100",
  email: "torres@example.org",
  fax: null,
  address: null,
  notes: "Available Tuesdays and Thursdays.",
  is_primary: true,
  patient_id: "patient-1",
};

let fetchSpy: ReturnType<typeof vi.fn>;

function installFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  fetchSpy = vi.fn(impl);
  vi.stubGlobal("fetch", fetchSpy);
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("CareTeamPage", () => {
  it("20. renders provider name and role", async () => {
    installFetch(async (url) => {
      if (url.includes("/api/care-team?")) return jsonResponse({ members: [sampleMember] });
      if (url.includes("/api/auth/session")) return jsonResponse({ role: "caregiver" });
      return jsonResponse({});
    });
    const { default: CareTeamPage } = await import("@/app/(app)/patients/[id]/care-team/page");
    render(<CareTeamPage />);
    await waitFor(() =>
      expect(screen.getByText("Dr. Melissa Torres")).toBeInTheDocument()
    );
    expect(screen.getByText(/Oncologist/i)).toBeInTheDocument();
  });

  it("21. empty state shows warm copy", async () => {
    installFetch(async (url) => {
      if (url.includes("/api/care-team?")) return jsonResponse({ members: [] });
      if (url.includes("/api/auth/session")) return jsonResponse({ role: "caregiver" });
      return jsonResponse({});
    });
    const { default: CareTeamPage } = await import("@/app/(app)/patients/[id]/care-team/page");
    render(<CareTeamPage />);
    await waitFor(() =>
      expect(screen.getByTestId("care-team-empty")).toBeInTheDocument()
    );
    expect(screen.getByTestId("care-team-empty").textContent).toMatch(
      /your care team will appear here/i
    );
  });

  it("22. phone link has correct tel: href", async () => {
    installFetch(async (url) => {
      if (url.includes("/api/care-team?")) return jsonResponse({ members: [sampleMember] });
      if (url.includes("/api/auth/session")) return jsonResponse({ role: "caregiver" });
      return jsonResponse({});
    });
    const { default: CareTeamPage } = await import("@/app/(app)/patients/[id]/care-team/page");
    const { container } = render(<CareTeamPage />);
    await waitFor(() =>
      expect(container.querySelector('[data-action="phone"]')).not.toBeNull()
    );
    const phone = container.querySelector('[data-action="phone"]') as HTMLAnchorElement;
    expect(phone.getAttribute("href")).toBe("tel:555-0100");
  });

  it("23. email link has correct mailto: href", async () => {
    installFetch(async (url) => {
      if (url.includes("/api/care-team?")) return jsonResponse({ members: [sampleMember] });
      if (url.includes("/api/auth/session")) return jsonResponse({ role: "caregiver" });
      return jsonResponse({});
    });
    const { default: CareTeamPage } = await import("@/app/(app)/patients/[id]/care-team/page");
    const { container } = render(<CareTeamPage />);
    await waitFor(() =>
      expect(container.querySelector('[data-action="email"]')).not.toBeNull()
    );
    const email = container.querySelector('[data-action="email"]') as HTMLAnchorElement;
    expect(email.getAttribute("href")).toBe("mailto:torres@example.org");
  });
});
