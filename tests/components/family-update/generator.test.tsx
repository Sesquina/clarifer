/**
 * tests/components/family-update/generator.test.tsx
 * Vitest + Testing Library suite for the web family-update generator page UI behavior.
 * Tables: none (component is fetch-driven; backend is mocked at the global fetch boundary).
 * Auth: not exercised; component assumes the user is already authenticated.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: No PHI stored in this file. Tests use synthetic patient ids and stubbed stream output.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "patient-1" }),
}));

function buildStreamResponse(text: string, language: "en" | "es"): Response {
  const encoder = new TextEncoder();
  const disclaimer =
    language === "es"
      ? "Esta actualizacion fue generada con ayuda de IA."
      : "This update was AI-assisted.";
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(JSON.stringify({ kind: "meta", language, disclaimer, generated_at: "2026-04-24T00:00:00Z" }) + "\n")
      );
      for (const chunk of text.split(" ")) {
        controller.enqueue(encoder.encode(JSON.stringify({ kind: "text", text: chunk + " " }) + "\n"));
      }
      controller.enqueue(encoder.encode(JSON.stringify({ kind: "done" }) + "\n"));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

describe("Family Update generator (rendered via page)", () => {
  let openSpy: ReturnType<typeof vi.fn>;
  let writeText: ReturnType<typeof vi.fn>;
  let lastLang: "en" | "es" = "en";

  beforeEach(() => {
    lastLang = "en";
    const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/family-update/generate" && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as { language?: "en" | "es" };
        lastLang = body.language === "es" ? "es" : "en";
        const text =
          body.language === "es"
            ? "Esta semana fue tranquila"
            : "This week was steady";
        return Promise.resolve(buildStreamResponse(text, body.language === "es" ? "es" : "en"));
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchSpy);

    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("1. language toggle changes the request language sent to the API", async () => {
    const { default: Page } = await import("@/app/(app)/patients/[id]/family-update/page");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Espanol" }));
    fireEvent.click(screen.getByRole("button", { name: /Generate update/i }));
    await waitFor(() => {
      expect(lastLang).toBe("es");
    });
    expect(await screen.findByText(/Esta actualizacion fue generada con ayuda de IA/i)).toBeInTheDocument();
  });

  it("2. copy button writes the generated text to the clipboard", async () => {
    const { default: Page } = await import("@/app/(app)/patients/[id]/family-update/page");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Generate update/i }));
    const copyBtn = await screen.findByRole("button", { name: /Copy to clipboard/i });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      const arg = writeText.mock.calls[0][0] as string;
      expect(arg.length).toBeGreaterThan(0);
      expect(arg).toMatch(/This week was steady/);
    });
  });

  it("3. WhatsApp button opens wa.me URL with prefilled text", async () => {
    const { default: Page } = await import("@/app/(app)/patients/[id]/family-update/page");
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Generate update/i }));
    const waBtn = await screen.findByRole("button", { name: /Send via WhatsApp/i });
    fireEvent.click(waBtn);
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalled();
      const url = String(openSpy.mock.calls[0][0]);
      expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
      expect(decodeURIComponent(url.split("text=")[1])).toMatch(/This week was steady/);
    });
  });
});
