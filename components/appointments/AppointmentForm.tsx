"use client";

import { useState } from "react";

interface AppointmentFormProps {
  patientId: string;
  onSuccess?: () => void;
}

type Status = "idle" | "saving" | "saved" | "error";

export function AppointmentForm({ patientId, onSuccess }: AppointmentFormProps) {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [providerName, setProviderName] = useState("");
  const [providerSpecialty, setProviderSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          title: title.trim(),
          datetime: datetime || undefined,
          providerName: providerName || undefined,
          providerSpecialty: providerSpecialty || undefined,
          location: location || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setStatus("error");
        setErrorMsg(err.error || "Failed to save appointment");
        return;
      }

      setStatus("saved");
      onSuccess?.();
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 48,
    borderRadius: 12,
    border: "1.5px solid #E8E2D9",
    padding: "0 16px",
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "var(--font-dm-sans)",
  };

  if (status === "saved") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#2C5F4A" }}>Appointment saved</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Appointment title"
        required
        style={inputStyle}
      />
      <input
        value={datetime}
        onChange={(e) => setDatetime(e.target.value)}
        type="datetime-local"
        style={inputStyle}
      />
      <input
        value={providerName}
        onChange={(e) => setProviderName(e.target.value)}
        placeholder="Provider name"
        style={inputStyle}
      />
      <input
        value={providerSpecialty}
        onChange={(e) => setProviderSpecialty(e.target.value)}
        placeholder="Specialty"
        style={inputStyle}
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        style={inputStyle}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={3}
        style={{ ...inputStyle, height: "auto", padding: "12px 16px", resize: "vertical" }}
      />

      {status === "error" && (
        <p style={{ fontSize: 13, color: "#C4714A" }}>{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving" || !title.trim()}
        style={{
          height: 48,
          borderRadius: 24,
          backgroundColor: "#2C5F4A",
          color: "#FFFFFF",
          border: "none",
          fontSize: 15,
          fontWeight: 600,
          cursor: status === "saving" || !title.trim() ? "default" : "pointer",
          opacity: status === "saving" || !title.trim() ? 0.5 : 1,
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {status === "saving" ? "Saving..." : "Save appointment"}
      </button>
    </form>
  );
}
