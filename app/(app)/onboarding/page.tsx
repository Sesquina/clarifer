"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleComplete() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("patients").insert({
      name,
      dob: dob || null,
      sex: sex || null,
      custom_diagnosis: diagnosis || null,
      diagnosis_date: diagnosisDate || null,
      created_by: user.id,
      status: "active",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Set up your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Step {step} of 2</p>
      </div>

      {step === 1 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Patient information</CardTitle>
            <CardDescription>Who are you managing care for?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Patient name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dob" className="text-sm font-medium">Date of birth</label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sex" className="text-sm font-medium">Sex</label>
              <Select id="sex" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!name.trim()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Condition details</CardTitle>
            <CardDescription>This helps Medalyn personalize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="diagnosis" className="text-sm font-medium">Primary diagnosis</label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g., Lupus, Crohn's, MS..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="diagDate" className="text-sm font-medium">Date of diagnosis</label>
              <Input
                id="diagDate"
                type="date"
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleComplete} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
