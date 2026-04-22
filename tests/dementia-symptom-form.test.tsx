/**
 * Sprint 2A — Test 2
 * DementiaSymptomForm renders all required dementia-specific fields.
 * Completable in under 60 seconds: all fields visible on first render, no pagination.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DementiaSymptomForm from "@/components/symptoms/DementiaSymptomForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("DementiaSymptomForm", () => {
  it("renders all dementia-specific scale and checkbox fields", () => {
    render(<DementiaSymptomForm patientId="test-patient-eleanor" onSuccess={vi.fn()} />);

    // Scale fields
    expect(screen.getByText(/memory loss/i)).toBeTruthy();
    expect(screen.getByText(/confusion/i)).toBeTruthy();
    expect(screen.getByText(/sleep disruption/i)).toBeTruthy();
    expect(screen.getByText(/caregiver stress/i)).toBeTruthy();

    // Behavioral change checkboxes (heading + sr-only legend both match — use getAllByText)
    expect(screen.getAllByText(/behavioral changes/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/aggression/i)).toBeTruthy();
    expect(screen.getByLabelText(/wandering/i)).toBeTruthy();
    expect(screen.getByLabelText(/repetition/i)).toBeTruthy();
    expect(screen.getByLabelText(/agitation/i)).toBeTruthy();

    // Eating and hygiene checkboxes
    expect(screen.getAllByText(/eating and hygiene/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/refuses food/i)).toBeTruthy();
    expect(screen.getByLabelText(/forgets to eat/i)).toBeTruthy();
    expect(screen.getByLabelText(/hygiene neglect/i)).toBeTruthy();

    // Submit button
    expect(screen.getByRole("button", { name: /save log/i })).toBeTruthy();
  });
});
