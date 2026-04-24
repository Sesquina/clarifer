/**
 * Sprint 8 — cholangiocarcinoma biomarker catalog.
 * These are the biomarkers the Biomarker Tracker shows by default.
 */

export interface BiomarkerRef {
  type: string;
  label: string;
  description: string;
  actionableTherapy?: string;
  targetedApprovalNote?: string;
  isTumorMarker?: boolean;
}

export const CHOL_BIOMARKERS: BiomarkerRef[] = [
  {
    type: "FGFR2 fusion",
    label: "FGFR2 fusion/rearrangement",
    description: "Drives a subset of intrahepatic cholangiocarcinoma.",
    actionableTherapy: "Pemigatinib (Pemazyre)",
    targetedApprovalNote:
      "FDA-approved for FGFR2 fusion-positive cholangiocarcinoma.",
  },
  {
    type: "IDH1 mutation",
    label: "IDH1 mutation",
    description: "Actionable targeted therapy available.",
    actionableTherapy: "Ivosidenib",
    targetedApprovalNote: "FDA-approved for IDH1-mutant cholangiocarcinoma.",
  },
  {
    type: "IDH2 mutation",
    label: "IDH2 mutation",
    description: "Emerging target; trials available.",
  },
  {
    type: "HER2 amplification",
    label: "HER2 amplification",
    description: "Trials exploring HER2-directed therapy in biliary tract cancers.",
  },
  {
    type: "MSI",
    label: "Microsatellite instability (MSI)",
    description: "MSI-high tumors can respond to immune checkpoint inhibitors.",
    actionableTherapy: "Pembrolizumab",
  },
  {
    type: "TMB",
    label: "Tumor mutational burden (TMB)",
    description: "High TMB may indicate immunotherapy eligibility.",
  },
  {
    type: "PD-L1 expression",
    label: "PD-L1 expression",
    description: "Relevant for immune checkpoint therapy decisions.",
  },
  {
    type: "KRAS mutation",
    label: "KRAS mutation",
    description: "Emerging targeted therapies; relevant for trial eligibility.",
  },
  {
    type: "BRAF V600E",
    label: "BRAF V600E mutation",
    description: "Targeted therapy combinations available.",
    actionableTherapy: "Dabrafenib + trametinib",
  },
  {
    type: "NTRK fusion",
    label: "NTRK fusion",
    description: "Rare but highly actionable.",
    actionableTherapy: "Larotrectinib / entrectinib",
  },
  {
    type: "CA 19-9",
    label: "CA 19-9 (tumor marker)",
    description: "Tracked numerically to monitor treatment response.",
    isTumorMarker: true,
  },
  {
    type: "CEA",
    label: "CEA (tumor marker)",
    description: "Tracked numerically to monitor treatment response.",
    isTumorMarker: true,
  },
];
