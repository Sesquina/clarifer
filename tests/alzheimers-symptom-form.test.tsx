/**
 * Sprint 2B — Test 2
 * AlzheimersSymptomForm renders all required Alzheimer's-specific fields.
 * Completable in under 60 seconds: all fields visible on first render, no pagination.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AlzheimersSymptomForm from "@/components/symptoms/AlzheimersSymptomForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("AlzheimersSymptomForm", () => {
  it("renders all alzheimers-specific scale and checkbox fields", () => {
    render(<AlzheimersSymptomForm patientId="test-patient-margaret" onSuccess={vi.fn()} />);

    // Scale fields — word_finding_difficulty distinguishes Alzheimer's from generic dementia
    expect(screen.getByText(/memory loss/i)).toBeTruthy();
    expect(screen.getByText(/word.finding difficulty/i)).toBeTruthy();
    expect(screen.getByText(/confusion/i)).toBeTruthy();
    expect(screen.getByText(/sleep disruption/i)).toBeTruthy();
    expect(screen.getByText(/caregiver stress/i)).toBeTruthy();

    // Mood change checkboxes
    expect(screen.getAllByText(/mood changes/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/depression/i)).toBeTruthy();
    expect(screen.getByLabelText(/anxiety/i)).toBeTruthy();
    expect(screen.getByLabelText(/irritability/i)).toBeTruthy();
    expect(screen.getByLabelText(/apathy/i)).toBeTruthy();

    // Behavioral change checkboxes
    expect(screen.getAllByText(/behavioral changes/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/aggression/i)).toBeTruthy();
    expect(screen.getByLabelText(/wandering/i)).toBeTruthy();
    expect(screen.getByLabelText(/repetition/i)).toBeTruthy();
    expect(screen.getByLabelText(/agitation/i)).toBeTruthy();

    // Submit button
    expect(screen.getByRole("button", { name: /save log/i })).toBeTruthy();
  });
});
