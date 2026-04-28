/**
 * tests/components/appointments/create-form.test.tsx
 * Tests for AppointmentCreateForm: required validation + happy path
 * POSTs to /api/appointments.
 * Tables: none (component is fetch-driven).
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI. Synthetic ids only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AppointmentCreateForm } from "@/components/appointments/AppointmentCreateForm";

describe("AppointmentCreateForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("33. POSTs to /api/appointments and calls onCreated with the new id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ appointment: { id: "appt-99" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onCreated = vi.fn();
    render(<AppointmentCreateForm patientId="pat-1" onCreated={onCreated} />);
    fireEvent.change(screen.getByPlaceholderText(/oncology follow-up/i), {
      target: { value: "Oncology follow-up" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save appointment/i }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("appt-99"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/appointments",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body).toMatchObject({ patient_id: "pat-1", title: "Oncology follow-up" });
  });

  it("34. surfaces a friendly error when the server rejects the create", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "We could not save this appointment." }),
      })
    );
    render(<AppointmentCreateForm patientId="pat-1" />);
    fireEvent.change(screen.getByPlaceholderText(/oncology follow-up/i), {
      target: { value: "Visit" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save appointment/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/could not save/i);
    });
  });
});
