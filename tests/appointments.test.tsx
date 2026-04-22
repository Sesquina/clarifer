// Bug 1: Appointment form should POST to API and show success state
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("AppointmentForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "appt-1" }),
    });
  });

  test("renders a title input field", async () => {
    const { AppointmentForm } = await import("@/components/appointments/AppointmentForm");
    render(React.createElement(AppointmentForm, { patientId: "patient-1" }));
    expect(screen.getByPlaceholderText(/appointment title/i)).toBeTruthy();
  });

  test("POSTs to /api/appointments/create on submit", async () => {
    const { AppointmentForm } = await import("@/components/appointments/AppointmentForm");
    render(React.createElement(AppointmentForm, { patientId: "patient-1" }));

    fireEvent.change(screen.getByPlaceholderText(/appointment title/i), {
      target: { value: "Cardiology consultation" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/appointments/create",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  test("shows success state after saving", async () => {
    const { AppointmentForm } = await import("@/components/appointments/AppointmentForm");
    render(React.createElement(AppointmentForm, { patientId: "patient-1" }));

    fireEvent.change(screen.getByPlaceholderText(/appointment title/i), {
      target: { value: "Cardiology consultation" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeTruthy();
    });
  });
});
