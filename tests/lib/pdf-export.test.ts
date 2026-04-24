/**
 * Sprint 8 — PDF export generator.
 */
import { describe, it, expect } from "vitest";
import { generatePatientPdf } from "@/lib/export/generate-pdf";
import type { PdfBundle } from "@/lib/export/generate-pdf";

function bundle(): PdfBundle {
  return {
    patient: {
      id: "p1",
      name: "Carlos Rivera",
      dob: "1962-03-15",
      custom_diagnosis: "Cholangiocarcinoma Stage 4",
      diagnosis_date: "2026-01-22",
      emergency_contact_name: "Maria Rivera",
      emergency_contact_phone: "(555) 111-2233",
    },
    caregiverName: "Maria Rivera",
    primaryOncologist: "Dr. Sarah Chen",
    biomarkers: [
      { biomarker_type: "FGFR2 fusion", status: "positive", value: "FGFR2-BICC1", tested_date: "2026-02-07", notes: null },
    ],
    medications: [
      { name: "Gemcitabine", dose: "1000", unit: "mg/m2", frequency: "Every 3 weeks", start_date: "2026-01-29" },
    ],
    symptomSummary: [
      { day: "2026-03-01", severity: 4 },
      { day: "2026-03-02", severity: 5 },
    ],
    dpdFluoropyrimidine: false,
    documents: [
      { title: "Pathology report", summary: "FGFR2 fusion positive.", uploaded_at: "2026-02-07" },
    ],
    careTeam: [
      { name: "Dr. Sarah Chen", role: "oncologist", phone: "(555) 234-5678", email: "schen@memorial.org" },
    ],
    appointments: [
      { title: "Oncology follow-up", datetime: new Date().toLocaleString(), provider_name: "Dr. Sarah Chen", location: "Memorial", appointment_type: "oncology" },
    ],
    generatedAt: new Date().toISOString(),
  };
}

describe("PDF export", () => {
  it("generatePatientPdf returns a PDF buffer", async () => {
    const bytes = await generatePatientPdf(bundle());
    expect(bytes).toBeInstanceOf(Uint8Array);
    // PDF files start with "%PDF-".
    const header = String.fromCharCode(...bytes.subarray(0, 5));
    expect(header).toBe("%PDF-");
  }, 20000);

  it("PDF includes patient name in metadata", async () => {
    const bytes = await generatePatientPdf(bundle());
    // react-pdf stores the document Title/Author/Subject as indirect
    // string objects in plaintext -- the patient name (set via Document
    // title) appears in the raw bytes even with page-stream compression.
    const text = Buffer.from(bytes).toString("latin1");
    expect(text).toContain("Carlos Rivera");
  }, 30000);
});
