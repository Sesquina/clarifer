// S14 -- verifies the 30-minute inactivity timeout signs the user out
// and redirects to /login?reason=session_timeout.
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

const signOut = vi.fn().mockResolvedValue({ error: null });
const replace = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

describe("SessionTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    signOut.mockClear();
    replace.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("signs out and redirects after 30 minutes of inactivity", async () => {
    const { default: SessionTimeout } = await import("@/components/SessionTimeout");
    render(React.createElement(SessionTimeout));

    // Just before the 30-minute mark: nothing has fired yet.
    await vi.advanceTimersByTimeAsync(30 * 60 * 1000 - 1);
    expect(signOut).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    // Cross the threshold; let the awaited signOut promise resolve.
    await vi.advanceTimersByTimeAsync(2);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login?reason=session_timeout");
  });
});
