// Bug 2: Upload Doc quick action should link to /documents/upload, not /documents
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { className }, children),
}));

describe("QuickActions", () => {
  test("Upload Doc action links to the document upload flow", async () => {
    const { QuickActions } = await import("@/components/home/quick-actions");
    render(React.createElement(QuickActions));

    const links = screen.getAllByRole("link");
    const uploadDocLink = links.find((l) => l.textContent?.includes("Upload Doc"));
    expect(uploadDocLink).toBeDefined();
    expect(uploadDocLink).toHaveAttribute("href", "/documents/upload");
  });
});
