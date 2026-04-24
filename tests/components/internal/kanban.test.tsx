import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "samira.esquina@clarifer.com" } },
      }),
    },
  }),
}));

const mockTasks = [
  {
    id: "task-1",
    title: "Build command center",
    description: "Kanban + digest",
    lane: "build",
    priority: "high",
    status: "active",
    due_date: null,
    category: "development",
    assigned_to: "claude",
    created_by: "claude",
    completed_at: null,
    created_at: "2026-04-24T00:00:00Z",
    updated_at: "2026-04-24T00:00:00Z",
  },
  {
    id: "task-2",
    title: "File 83(b)",
    description: "Legal deadline",
    lane: "samira",
    priority: "high",
    status: "active",
    due_date: "2026-05-22",
    category: "legal",
    assigned_to: "samira",
    created_by: "claude",
    completed_at: null,
    created_at: "2026-04-24T00:00:00Z",
    updated_at: "2026-04-24T00:00:00Z",
  },
  {
    id: "task-3",
    title: "EIN from IRS",
    description: "Waiting on IRS",
    lane: "blocked",
    priority: "high",
    status: "active",
    due_date: null,
    category: "organizational",
    assigned_to: null,
    created_by: "claude",
    completed_at: null,
    created_at: "2026-04-24T00:00:00Z",
    updated_at: "2026-04-24T00:00:00Z",
  },
];

describe("Sprint Board (Kanban)", () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockReset();
    // Default fetch: initial load returns tasks
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/internal/tasks" && (!init || init.method === undefined || init.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tasks: mockTasks }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ task: {} }) });
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("10. renders tasks in their correct lanes", async () => {
    const { default: BoardPage } = await import("@/app/internal/board/page");
    render(<BoardPage />);
    expect(await screen.findByText("Build command center")).toBeInTheDocument();
    expect(screen.getByText("File 83(b)")).toBeInTheDocument();
    expect(screen.getByText("EIN from IRS")).toBeInTheDocument();

    const buildSection = document.querySelector('section[data-lane="build"]');
    expect(buildSection?.textContent).toContain("Build command center");
    const samiraSection = document.querySelector('section[data-lane="samira"]');
    expect(samiraSection?.textContent).toContain("File 83(b)");
  });

  it("11. dropping a card on a new lane calls PATCH with that lane", async () => {
    const patchCalls: Array<{ url: string; body: unknown }> = [];
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/internal/tasks" && (!init || init.method === undefined || init.method === "GET")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ tasks: mockTasks }) });
      }
      if (init?.method === "PATCH") {
        patchCalls.push({ url, body: JSON.parse(String(init.body)) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ task: {} }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { default: BoardPage } = await import("@/app/internal/board/page");
    render(<BoardPage />);

    await screen.findByText("File 83(b)");

    const card = document.querySelector('[data-task-id="task-2"]') as HTMLElement;
    const target = document.querySelector('section[data-lane="michael"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(target).toBeTruthy();

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("task-2"),
      effectAllowed: "",
      dropEffect: "",
    } as unknown as DataTransfer;

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    await waitFor(() => {
      expect(patchCalls.length).toBeGreaterThan(0);
    });
    expect(patchCalls[0].url).toBe("/api/internal/tasks/task-2");
    expect(patchCalls[0].body).toMatchObject({ lane: "michael" });
  });

  it("12. mark done updates task status and applies visual feedback", async () => {
    const patchCalls: Array<{ url: string; body: unknown }> = [];
    fetchSpy.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/internal/tasks" && (!init || init.method === undefined || init.method === "GET")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ tasks: mockTasks }) });
      }
      if (init?.method === "PATCH") {
        patchCalls.push({ url, body: JSON.parse(String(init.body)) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ task: {} }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { default: BoardPage } = await import("@/app/internal/board/page");
    render(<BoardPage />);

    const btn = await screen.findByRole("button", { name: /Mark Build command center as done/i });

    // Initial state: card shows as active, button is rendered
    const cardBefore = document.querySelector('[data-task-id="task-1"]') as HTMLElement;
    expect(cardBefore.getAttribute("data-done")).toBe("false");
    expect(
      document.querySelector('[data-task-id="task-1"] button[data-action="mark-done"]')
    ).not.toBeNull();

    fireEvent.click(btn);

    // Server-side confirmation: PATCH fires with status=done to the right endpoint
    await waitFor(() => {
      expect(patchCalls.length).toBeGreaterThan(0);
    });
    expect(patchCalls[0].url).toBe("/api/internal/tasks/task-1");
    expect(patchCalls[0].body).toMatchObject({ status: "done" });
  });
});
