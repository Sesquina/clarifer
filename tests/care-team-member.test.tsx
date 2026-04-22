// Bug 4: Care team email link should open device email client via mailto:
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const member = {
  id: "1",
  name: "Dr. Smith",
  role: "Doctor",
  phone: null,
  email: "dr.smith@hospital.com",
  notes: null,
};

describe("CareTeamMember", () => {
  test("email link uses mailto: protocol with provider email", async () => {
    const { CareTeamMember } = await import("@/components/care-team/CareTeamMember");
    render(React.createElement(CareTeamMember, { member, onDelete: vi.fn() }));

    const emailLink = screen.getByText("dr.smith@hospital.com").closest("a");
    expect(emailLink).toHaveAttribute("href", "mailto:dr.smith@hospital.com");
  });

  test("phone link uses tel: protocol", async () => {
    const { CareTeamMember } = await import("@/components/care-team/CareTeamMember");
    const memberWithPhone = { ...member, phone: "555-1234" };
    render(React.createElement(CareTeamMember, { member: memberWithPhone, onDelete: vi.fn() }));

    const phoneLink = screen.getByText("555-1234").closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:555-1234");
  });
});
