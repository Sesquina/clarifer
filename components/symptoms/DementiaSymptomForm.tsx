"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const BEHAVIORAL_OPTIONS = ["aggression", "wandering", "repetition", "agitation"] as const;
const EATING_HYGIENE_OPTIONS = ["refuses food", "forgets to eat", "hygiene neglect"] as const;

interface Props {
  patientId: string;
  onSuccess?: (logId: string) => void;
}

function ScaleField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <input
          type="range"
          name={name}
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label={label}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 — None</span>
          <span className="font-medium text-foreground">{value}/10</span>
          <span>10 — Severe</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckboxGroup({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{legend}</CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset>
          <legend className="sr-only">{legend}</legend>
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm capitalize cursor-pointer">
                <input
                  type="checkbox"
                  aria-label={opt}
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-primary h-4 w-4"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}

export default function DementiaSymptomForm({ patientId, onSuccess }: Props) {
  const [memoryLoss, setMemoryLoss] = useState(5);
  const [confusion, setConfusion] = useState(5);
  const [sleepDisruption, setSleepDisruption] = useState(5);
  const [caregiverStress, setCaregiverStress] = useState(5);
  const [behavioralChanges, setBehavioralChanges] = useState<string[]>([]);
  const [eatingHygiene, setEatingHygiene] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overallSeverity = Math.round(
    (memoryLoss + confusion + sleepDisruption + caregiverStress) / 4
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/symptoms/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          conditionTemplateId: "dementia",
          overallSeverity,
          responses: {
            memory_loss: memoryLoss,
            confusion,
            sleep_disruption: sleepDisruption,
            caregiver_stress: caregiverStress,
            behavioral_changes: behavioralChanges,
            eating_hygiene: eatingHygiene,
          },
        }),
      });

      if (!res.ok) {
        setError("Failed to save log. Please try again.");
        return;
      }

      const data = await res.json() as { id: string };
      onSuccess?.(data.id);
    } catch {
      setError("Failed to save log. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScaleField label="Memory loss" name="memory_loss" value={memoryLoss} onChange={setMemoryLoss} />
      <ScaleField label="Confusion / disorientation" name="confusion" value={confusion} onChange={setConfusion} />
      <ScaleField label="Sleep disruption" name="sleep_disruption" value={sleepDisruption} onChange={setSleepDisruption} />
      <ScaleField label="Caregiver stress level" name="caregiver_stress" value={caregiverStress} onChange={setCaregiverStress} />

      <CheckboxGroup
        legend="Behavioral changes"
        options={BEHAVIORAL_OPTIONS}
        selected={behavioralChanges}
        onChange={setBehavioralChanges}
      />

      <CheckboxGroup
        legend="Eating and hygiene"
        options={EATING_HYGIENE_OPTIONS}
        selected={eatingHygiene}
        onChange={setEatingHygiene}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save log
      </Button>
    </form>
  );
}
