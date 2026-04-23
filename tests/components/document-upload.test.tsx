/**
 * Tests for DocumentUploadForm (Sprint 5)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

describe("DocumentUploadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders file input and upload button", async () => {
    const { DocumentUploadForm } = await import("@/components/documents/DocumentUploadForm");
    render(React.createElement(DocumentUploadForm, { patientId: "p-1", patientName: "Carlos" }));
    expect(screen.getByLabelText("Choose file")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });

  it("shows error when submitting without a file", async () => {
    const { DocumentUploadForm } = await import("@/components/documents/DocumentUploadForm");
    render(React.createElement(DocumentUploadForm, { patientId: "p-1", patientName: "Carlos" }));
    fireEvent.submit(screen.getByRole("form", { name: "Upload document" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Please select a file");
    });
  });

  it("shows success message after successful upload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "doc-new" }), { status: 201 })
    );
    const { DocumentUploadForm } = await import("@/components/documents/DocumentUploadForm");
    render(React.createElement(DocumentUploadForm, { patientId: "p-1", patientName: "Carlos" }));

    const input = screen.getByLabelText("Choose file") as HTMLInputElement;
    const file = new File(["content"], "report.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);

    fireEvent.submit(screen.getByRole("form", { name: "Upload document" }));
    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument();
    });
  });
});
