/**
 * tests/app/app-layout.test.ts
 * Verifies the auth guard in app/(app)/layout.tsx.
 * When no session is present, the layout must redirect to /login.
 * Sprint: fix/app-layout-chrome
 * HIPAA: No PHI in this file.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

vi.mock("@/components/nav/nav-rail", () => ({
  NavRail: () => null,
}));

vi.mock("@/components/nav/patient-crumb", () => ({
  PatientCrumb: () => null,
}));

vi.mock("@/components/layout/app-header", () => ({
  AppHeader: () => null,
}));

vi.mock("@/components/layout/bottom-nav", () => ({
  BottomNav: () => null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

function makeSupabase(user: { id: string } | null, fullName: string | null = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fullName ? { full_name: fullName } : null }),
    }),
  };
}

describe("app/(app)/layout.tsx auth guard", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockReset();
    // redirect in Next.js throws a special error to abort rendering
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT:/login");
    });
  });

  it("redirects to /login when there is no session", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase(null));

    const { default: AppLayout } = await import("@/app/(app)/layout");

    await expect(AppLayout({ children: null })).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("does NOT redirect when a valid session exists", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, "Jane Doe")
    );

    const { default: AppLayout } = await import("@/app/(app)/layout");

    await expect(AppLayout({ children: null })).resolves.not.toThrow();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
