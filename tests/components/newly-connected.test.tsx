/**
 * Sprint 8 — Newly Connected checklist.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewlyConnectedChecklist } from "@/components/newly-connected/NewlyConnectedChecklist";
import { buildChecklist } from "@/lib/ccf/newly-connected-template";

describe("NewlyConnectedChecklist", () => {
  it("new patient → checklist auto-created with week sections", () => {
    render(<NewlyConnectedChecklist />);
    expect(screen.getByText(/Week 1 -- First Steps/i)).toBeInTheDocument();
    expect(screen.getByText(/Week 2 -- Treatment Understanding/i)).toBeInTheDocument();
    expect(screen.getByText(/Week 3 -- Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Week 4 -- Ongoing Care/i)).toBeInTheDocument();
    const items = buildChecklist();
    expect(items.length).toBeGreaterThan(15);
    expect(items.every((i) => i.checked === false)).toBe(true);
  });

  it("checking an item flips state and notifies via onChange", () => {
    const changes: number[] = [];
    render(
      <NewlyConnectedChecklist
        onChange={(items) => changes.push(items.filter((i) => i.checked).length)}
      />
    );
    const firstItem = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstItem);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[changes.length - 1]).toBe(1);
  });
});
