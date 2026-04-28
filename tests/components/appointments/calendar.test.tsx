/**
 * tests/components/appointments/calendar.test.tsx
 * Tests for AppointmentCalendar (month + week toggle, rendering).
 * Tables: none (pure renderer over a prop).
 * Sprint: Sprint 11 -- Appointment Tracker
 *
 * HIPAA: No PHI. Synthetic appointment fixtures only.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  AppointmentCalendar,
  type CalendarAppointment,
} from "@/components/appointments/AppointmentCalendar";

const FIXED = new Date("2026-05-15T10:00:00Z");

const sample: CalendarAppointment[] = [
  { id: "a1", title: "Oncology follow-up", datetime: "2026-05-15T10:00:00Z", appointment_type: "oncology" },
  { id: "a2", title: "Imaging", datetime: "2026-05-22T09:00:00Z", appointment_type: "imaging" },
];

describe("AppointmentCalendar", () => {
  it("30. renders an appointment in the month grid", () => {
    render(<AppointmentCalendar appointments={sample} initialDate={FIXED} />);
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(7);
    expect(screen.getByText("Oncology follow-up")).toBeInTheDocument();
  });

  it("31. switches to week view and shows the empty-state copy on a quiet day", () => {
    render(<AppointmentCalendar appointments={[]} initialDate={FIXED} />);
    fireEvent.click(screen.getByRole("button", { name: /week/i }));
    // Several days will display "No appointments scheduled."
    expect(screen.getAllByText(/no appointments scheduled/i).length).toBeGreaterThan(0);
  });

  it("32. invokes onSelectAppointment when an item is clicked", () => {
    const onSelect = vi.fn();
    render(
      <AppointmentCalendar
        appointments={sample}
        initialDate={FIXED}
        onSelectAppointment={onSelect}
      />
    );
    fireEvent.click(screen.getByText("Oncology follow-up"));
    expect(onSelect).toHaveBeenCalledWith("a1");
  });
});
