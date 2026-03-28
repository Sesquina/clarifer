"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Tables<"medications">[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("created_by", user.id)
        .limit(1)
        .single();
      if (!patient) return;
      setPatientId(patient.id);

      const { data: meds } = await supabase
        .from("medications")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (meds) setMedications(meds);
    }
    load();
  }, [supabase]);

  async function handleAdd() {
    if (!patientId || !name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("medications")
      .insert({
        patient_id: patientId,
        name,
        dose: dose || null,
        frequency: frequency || null,
        is_active: true,
        added_by: user?.id || null,
      })
      .select()
      .single();

    if (data) setMedications((prev) => [data, ...prev]);
    setShowAdd(false);
    setName("");
    setDose("");
    setFrequency("");
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Tools
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Medications</h1>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
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

        <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
          <DialogHeader>
            <DialogTitle>Add medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Medication name" />
            <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g., 50mg)" />
            <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Frequency (e.g., daily)" />
            <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>
              Add medication
            </Button>
          </div>
        </Dialog>
      </div>
    </PageContainer>
  );
}
