/**
 * tests/appointments.test.tsx
 * Sprint 1 Bug 1 regression -- "appointments not saving" -- migrated
 * in Sprint 11b to target the new AppointmentCreateForm component
 * (the legacy AppointmentForm + /api/appointments/create route were
 * removed). Behavior preserved: form renders, posts to the canonical
 * /api/appointments endpoint, and surfaces success.
 * Tables: none (component is fetch-driven; backend mocked at
 *         the global fetch boundary).
 * Auth: not exercised; component assumes authenticated session.
 * Sprint: Sprint 1 (original) / Sprint 11b (cleanup migration)
 *
 * HIPAA: No PHI; synthetic patient id only.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("AppointmentCreateForm (Sprint 1 Bug 1 regression)", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ appointment: { id: "appt-1" } }),
    });
  });

  test("renders a title input field", async () => {
    const { AppointmentCreateForm } = await import(
      "@/components/appointments/AppointmentCreateForm"
    );
    render(React.createElement(AppointmentCreateForm, { patientId: "patient-1" }));
    expect(screen.getByPlaceholderText(/oncology follow-up/i)).toBeTruthy();
  });

  test("POSTs to /api/appointments on submit", async () => {
    const { AppointmentCreateForm } = await import(
      "@/components/appointments/AppointmentCreateForm"
    );
    render(React.createElement(AppointmentCreateForm, { patientId: "patient-1" }));

    fireEvent.change(screen.getByPlaceholderText(/oncology follow-up/i), {
      target: { value: "Cardiology consultation" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save appointment/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/appointments",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  test("invokes onCreated callback with the new appointment id after saving", async () => {
    const { AppointmentCreateForm } = await import(
      "@/components/appointments/AppointmentCreateForm"
    );
    const onCreated = vi.fn();
    render(
      React.createElement(AppointmentCreateForm, {
        patientId: "patient-1",
        onCreated,
      })
    );

    fireEvent.change(screen.getByPlaceholderText(/oncology follow-up/i), {
      target: { value: "Cardiology consultation" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save appointment/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith("appt-1");
    });
  });
});
