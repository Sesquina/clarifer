"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const SEVERITY_LABELS = ["None", "", "", "Mild", "", "", "Moderate", "", "", "Severe", ""];

export default function LogPage() {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
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
      if (patient) setPatientId(patient.id);
    }
    load();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !symptoms.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Get AI summary
    let aiSummary: string | null = null;
    try {
      const res = await fetch("/api/symptom-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, severity, notes }),
      });
      const data = await res.json();
      aiSummary = data.summary || null;
    } catch {
      // Continue without AI summary
    }

    const symptomList = symptoms.split(",").map((s) => s.trim()).filter(Boolean);

    await supabase.from("symptom_logs").insert({
      patient_id: patientId,
      logged_by: user?.id || null,
      symptoms: symptomList,
      overall_severity: severity,
      ai_summary: aiSummary,
      responses: notes ? { notes } : null,
    });

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/home"), 1500);
  }

  if (success) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <span className="text-2xl">&#10003;</span>
          </div>
          <h2 className="text-lg font-semibold">Logged successfully</h2>
          <p className="text-sm text-muted-foreground">Redirecting to home...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Log Symptoms</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">What symptoms are you experiencing?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., fatigue, joint pain, brain fog..."
                rows={3}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Overall severity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                type="range"
                min={0}
                max={10}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 — None</span>
                <span className="font-medium text-foreground">{severity}/10</span>
                <span>10 — Severe</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Additional notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else to note (triggers, medications taken, etc.)"
                rows={2}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading || !symptoms.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save log
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
