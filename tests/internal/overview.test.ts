import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

import {
  daysUntil,
  urgencyColor,
  MILESTONES_TIMELINE,
} from "@/app/internal/_overview/helpers";
import MilestoneTimeline from "@/app/internal/_overview/MilestoneTimeline";
import BlockerCard from "@/app/internal/_overview/BlockerCard";

describe("internal/overview", () => {
  it("1. CCF countdown calculates correct days from May 8 2026", () => {
    expect(daysUntil("2026-05-08", new Date("2026-05-08T00:00:00Z"))).toBe(0);
    expect(daysUntil("2026-05-08", new Date("2026-05-01T00:00:00Z"))).toBe(7);
    expect(daysUntil("2026-05-08", new Date("2026-04-24T00:00:00Z"))).toBe(14);
    expect(daysUntil("2026-05-08", new Date("2026-05-09T00:00:00Z"))).toBe(-1);
    expect(MILESTONES_TIMELINE.find((m) => m.key === "ccf")?.date).toBe("2026-05-08");

    // Urgency thresholds tied to the days math.
    expect(urgencyColor(3)).toBe("var(--accent)");
    expect(urgencyColor(10)).toBe("rgb(239, 159, 39)");
    expect(urgencyColor(30)).toBe("var(--primary)");
  });

  it("2. milestone timeline renders all 5 milestones", () => {
    const { container } = render(React.createElement(MilestoneTimeline));
    const items = container.querySelectorAll("[data-milestone]");
    expect(items).toHaveLength(5);
    const keys = Array.from(items).map((el) => el.getAttribute("data-milestone"));
    expect(keys).toEqual(["ccf", "app_store", "enterprise", "acl_grant", "series_a"]);
    // Each milestone has a progress ring (svg) drawn beside it.
    const rings = container.querySelectorAll("svg");
    expect(rings.length).toBeGreaterThanOrEqual(5);
  });

  it("3. blocker card renders 0 when no blocked tasks", () => {
    const { getByTestId, queryByText } = render(
      React.createElement(BlockerCard, { blockers: [] })
    );
    expect(getByTestId("blocker-count").textContent).toBe("0");
    expect(queryByText(/Nothing blocked/i)).not.toBeNull();
  });
});
