"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";

const MED_LIST = ["Morphine","Oxycodone","Hydrocodone","Fentanyl","Tramadol","Methadone","Buprenorphine","Ondansetron","Prochlorperazine","Metoclopramide","Dexamethasone","Prednisone","Methylprednisolone","Gemcitabine","Cisplatin","Carboplatin","Oxaliplatin","Fluorouracil","Capecitabine","Irinotecan","Pembrolizumab","Nivolumab","Atezolizumab","Bevacizumab","Cetuximab","Erlotinib","Imatinib","Ibrutinib","Palbociclib","Letrozole","Tamoxifen","Anastrozole","Leuprolide","Enzalutamide","Abiraterone","Lenalidomide","Bortezomib","Rituximab","Trastuzumab","Pertuzumab","Lorazepam","Alprazolam","Clonazepam","Zolpidem","Mirtazapine","Sertraline","Escitalopram","Duloxetine","Cymbalta","Gabapentin","Pregabalin","Amitriptyline","Baclofen","Cyclobenzaprine","Methocarbamol","Pantoprazole","Omeprazole","Lansoprazole","Famotidine","Lactulose","Senna","Polyethylene glycol","Docusate","Loperamide","Diphenhydramine","Hydroxyzine","Melatonin","Furosemide","Spironolactone","Lisinopril","Metoprolol","Atorvastatin","Enoxaparin","Warfarin","Apixaban","Rivaroxaban","Filgrastim","Epoetin alfa","Ferrous sulfate","Cyanocobalamin","Vitamin D","Calcium carbonate","Magnesium oxide","Zinc sulfate","Albumin","Darbepoetin","Zoledronic acid","Denosumab","Pamidronate"];

const DOSE_HINTS: Record<string, string> = {
  Morphine: "15mg, 30mg, 60mg", Oxycodone: "5mg, 10mg, 20mg", Fentanyl: "25mcg/hr, 50mcg/hr",
  Dexamethasone: "4mg, 8mg", Prednisone: "5mg, 10mg, 20mg", Gabapentin: "100mg, 300mg, 600mg",
  Ondansetron: "4mg, 8mg", Omeprazole: "20mg, 40mg", Pantoprazole: "40mg", Sertraline: "25mg, 50mg, 100mg",
  Metoprolol: "25mg, 50mg, 100mg", Atorvastatin: "10mg, 20mg, 40mg", Apixaban: "2.5mg, 5mg",
  Pembrolizumab: "200mg IV q3w", Nivolumab: "240mg IV q2w", Gemcitabine: "1000mg/m2 IV",
};

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Tables<"medications">[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase.from("patients").select("id").eq("created_by", user.id).limit(1).single();
      if (!patient) return;
      setPatientId(patient.id);
      const { data: meds } = await supabase.from("medications").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false });
      if (meds) setMedications(meds);
    }
    load();
  }, [supabase]);

  function handleNameChange(val: string) {
    setName(val);
    if (val.length >= 2) {
      const lower = val.toLowerCase();
      setSuggestions(MED_LIST.filter((m) => m.toLowerCase().includes(lower)).slice(0, 6));
    } else {
      setSuggestions([]);
    }
  }

  function selectMed(med: string) {
    setName(med);
    setSuggestions([]);
    if (DOSE_HINTS[med]) setDose("");
  }

  async function handleAdd() {
    if (!patientId || !name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // medications.organization_id is NOT NULL (Sprint 3 multi-tenancy).
    // Fetch the caller's org from public.users; if missing, abort the
    // insert instead of triggering a DB constraint error.
    const { data: me } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    const organizationId = me?.organization_id ?? null;
    if (!organizationId) return;
    const { data } = await supabase.from("medications").insert({
      patient_id: patientId,
      organization_id: organizationId,
      name,
      dose: dose || null,
      frequency: frequency || null,
      is_active: true,
      added_by: user.id,
    }).select().single();
    if (data) setMedications((prev) => [data, ...prev]);
    setShowAdd(false);
    setName("");
    setDose("");
    setFrequency("");
    setSuggestions([]);
  }

  const inputStyle: React.CSSProperties = {
    height: 48, borderRadius: 12, border: "1.5px solid #E8E2D9", padding: "0 16px",
    fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1A1A1A",
    backgroundColor: "#FFFFFF", width: "100%", boxSizing: "border-box", outline: "none",
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tools
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Medications</h1>
          <button onClick={() => setShowAdd(true)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 20,
            backgroundColor: "#2C5F4A", color: "#FFFFFF", border: "none", fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
          }}>
            <Plus size={16} /> Add
          </button>
        </div>

        {medications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Pill className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No medications tracked yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {medications.map((med) => (
              <Card key={med.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{med.name}</CardTitle>
                    <Badge variant={med.is_active ? "success" : "secondary"}>
                      {med.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {med.dose && <span>Dose: {med.dose}{med.unit ? ` ${med.unit}` : ""}</span>}
                    {med.frequency && <span>Freq: {med.frequency}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add medication modal */}
        {showAdd && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => { setShowAdd(false); setSuggestions([]); }} />
            <div style={{ position: "relative", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20 }}>Add medication</h3>
                <button onClick={() => { setShowAdd(false); setSuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={20} color="#6B6B6B" />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Medication name"
                    style={inputStyle}
                    autoComplete="off"
                  />
                  {suggestions.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                      backgroundColor: "#FFFFFF", border: "1.5px solid #E8E2D9", borderRadius: 12,
                      marginTop: 4, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}>
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => selectMed(s)}
                          style={{
                            width: "100%", padding: "10px 16px", border: "none",
                            backgroundColor: "transparent", fontSize: 14, color: "#1A1A1A",
                            cursor: "pointer", textAlign: "left", fontFamily: "var(--font-dm-sans)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F7F2EA")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder={DOSE_HINTS[name] ? `Common: ${DOSE_HINTS[name]}` : "Dose (e.g., 50mg)"}
                  style={inputStyle}
                />
                <input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Frequency (e.g., daily, twice daily)" style={inputStyle} />
                <button
                  onClick={handleAdd}
                  disabled={!name.trim()}
                  style={{
                    height: 48, borderRadius: 24, backgroundColor: "#2C5F4A", color: "#FFFFFF",
                    border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
                    opacity: !name.trim() ? 0.5 : 1, fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Add medication
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
