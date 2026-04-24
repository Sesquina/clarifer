/**
 * Sprint 8 — curated cholangiocarcinoma specialist centers.
 * Maintained in this file since CCF does not expose an API.
 */

export interface SpecialistCenter {
  id: string;
  centerName: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  ccfVerified: boolean;
  specialties: string[];
}

export const CCA_SPECIALISTS: SpecialistCenter[] = [
  {
    id: "mdanderson",
    centerName: "MD Anderson Cancer Center",
    city: "Houston",
    state: "TX",
    phone: "(877) 632-6789",
    website: "https://www.mdanderson.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology", "surgery", "clinical trials"],
  },
  {
    id: "mskcc",
    centerName: "Memorial Sloan Kettering",
    city: "New York",
    state: "NY",
    phone: "(800) 525-2225",
    website: "https://www.mskcc.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology", "clinical trials"],
  },
  {
    id: "mayo-rochester",
    centerName: "Mayo Clinic",
    city: "Rochester",
    state: "MN",
    phone: "(507) 538-3270",
    website: "https://www.mayoclinic.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology", "transplant"],
  },
  {
    id: "mayo-phoenix",
    centerName: "Mayo Clinic",
    city: "Phoenix",
    state: "AZ",
    phone: "(480) 515-6296",
    website: "https://www.mayoclinic.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology"],
  },
  {
    id: "mayo-jacksonville",
    centerName: "Mayo Clinic",
    city: "Jacksonville",
    state: "FL",
    phone: "(904) 953-0853",
    website: "https://www.mayoclinic.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology"],
  },
  {
    id: "johns-hopkins",
    centerName: "Johns Hopkins",
    city: "Baltimore",
    state: "MD",
    phone: "(410) 955-5222",
    website: "https://www.hopkinsmedicine.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology", "surgery"],
  },
  {
    id: "northwestern",
    centerName: "Northwestern Medicine",
    city: "Chicago",
    state: "IL",
    phone: "(312) 695-0990",
    website: "https://www.nm.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology"],
  },
  {
    id: "ucsf",
    centerName: "UCSF",
    city: "San Francisco",
    state: "CA",
    phone: "(415) 353-9888",
    website: "https://www.ucsfhealth.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology", "clinical trials"],
  },
  {
    id: "ucla",
    centerName: "UCLA Health",
    city: "Los Angeles",
    state: "CA",
    phone: "(310) 825-9111",
    website: "https://www.uclahealth.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology"],
  },
  {
    id: "stanford",
    centerName: "Stanford Medical Center",
    city: "Palo Alto",
    state: "CA",
    phone: "(650) 498-6000",
    website: "https://stanfordhealthcare.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology"],
  },
  {
    id: "cleveland",
    centerName: "Cleveland Clinic",
    city: "Cleveland",
    state: "OH",
    phone: "(216) 444-7923",
    website: "https://my.clevelandclinic.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology"],
  },
  {
    id: "mass-general",
    centerName: "Massachusetts General Hospital",
    city: "Boston",
    state: "MA",
    phone: "(617) 726-5130",
    website: "https://www.massgeneral.org",
    ccfVerified: true,
    specialties: ["hepatobiliary", "oncology", "clinical trials"],
  },
];

export function filterSpecialists(
  specialists: SpecialistCenter[],
  opts: { query?: string; specialty?: string }
): SpecialistCenter[] {
  const q = opts.query?.trim().toLowerCase();
  const sp = opts.specialty?.trim().toLowerCase();
  return specialists.filter((s) => {
    if (q && !`${s.city} ${s.state} ${s.centerName}`.toLowerCase().includes(q)) return false;
    if (sp && !s.specialties.some((x) => x.toLowerCase().includes(sp))) return false;
    return true;
  });
}
