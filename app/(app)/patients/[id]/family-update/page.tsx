/**
 * app/(app)/patients/[id]/family-update/page.tsx
 * Web page that lets a caregiver generate a plain-language family update in English or Spanish.
 * Tables: reads from /api/family-update/generate; no direct Supabase reads.
 * Auth: caregiver or patient role (server enforces); page assumes authenticated session.
 * Sprint: Sprint 9 -- Trials + Family Updates
 *
 * HIPAA: Renders generated update text on screen. No PHI written to logs from this file.
 */
"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

type Lang = "en" | "es";
type Range = 7 | 14 | 30;

const COPY = {
  en: {
    title: "Update your family",
    subhead: "Pull this week's care into a message. English and Spanish, ready for WhatsApp.",
    range7: "Last 7 days",
    range14: "Last 14 days",
    range30: "Last 30 days",
    generate: "Generate update",
    generating: "Writing your update...",
    copied: "Copied. Open WhatsApp to paste.",
    copy: "Copy to clipboard",
    share: "Share",
    whatsapp: "Send via WhatsApp",
    empty: "Pull together what happened this week. We'll write the first draft. You edit and send.",
    error: "We couldn't generate the update right now. Your data is safe. Try again in a moment.",
  },
  es: {
    title: "Actualizar a tu familia",
    subhead: "Reunimos los cuidados de la semana en un mensaje. Listo para WhatsApp.",
    range7: "Ultimos 7 dias",
    range14: "Ultimos 14 dias",
    range30: "Ultimos 30 dias",
    generate: "Generar actualizacion",
    generating: "Preparando tu actualizacion...",
    copied: "Copiado. Abre WhatsApp para pegar.",
    copy: "Copiar al portapapeles",
    share: "Compartir",
    whatsapp: "Enviar por WhatsApp",
    empty: "Reunamos lo que paso esta semana. Escribimos el borrador. Tu lo editas y lo envias.",
    error: "No pudimos generar la actualizacion ahora. Tus datos estan seguros. Intenta en un momento.",
  },
} as const;

interface MetaEvent { kind: "meta"; language: Lang; disclaimer: string; generated_at: string }
interface TextEvent { kind: "text"; text: string }
interface DoneEvent { kind: "done" }
interface ErrorEvent { kind: "error"; message: string }
type StreamEvent = MetaEvent | TextEvent | DoneEvent | ErrorEvent;

export default function FamilyUpdatePage() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id;

  const [lang, setLang] = useState<Lang>("en");
  const [range, setRange] = useState<Range>(7);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<MetaEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const t = COPY[lang];

  const generate = useCallback(async () => {
    if (!patientId || busy) return;
    setBusy(true);
    setText("");
    setMeta(null);
    setError(null);
    try {
      const res = await fetch("/api/family-update/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, language: lang, date_range_days: range }),
      });
      if (!res.ok || !res.body) {
        setError(t.error);
        setBusy(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }
          if (evt.kind === "meta") setMeta(evt);
          else if (evt.kind === "text") setText((prev) => prev + evt.text);
          else if (evt.kind === "error") setError(evt.message || t.error);
        }
      }
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }, [busy, lang, patientId, range, t.error]);

  async function copyToClipboard() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setToast(t.copied);
    setTimeout(() => setToast(null), 2500);
  }

  async function shareNative() {
    if (!text) return;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user dismissed
      }
    } else {
      copyToClipboard();
    }
  }

  function whatsappShare() {
    if (!text) return;
    copyToClipboard();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main style={{ ...BODY, padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ ...HEADING, fontSize: 28, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        {t.title}
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>
        {t.subhead}
      </p>

      <div className="flex flex-wrap items-center" style={{ gap: 12, marginBottom: 16 }}>
        <div className="flex" style={{ border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden" }}>
          <ToggleButton active={lang === "en"} onClick={() => setLang("en")}>English</ToggleButton>
          <ToggleButton active={lang === "es"} onClick={() => setLang("es")}>Espanol</ToggleButton>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(Number(e.target.value) as Range)}
          aria-label="Date range"
          style={{
            ...BODY,
            height: 40,
            padding: "0 12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--text)",
            fontSize: 14,
          }}
        >
          <option value={7}>{t.range7}</option>
          <option value={14}>{t.range14}</option>
          <option value={30}>{t.range30}</option>
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          aria-label="Generate update"
          style={{
            ...BODY,
            height: 48,
            padding: "0 24px",
            borderRadius: 24,
            backgroundColor: "var(--accent)",
            color: "var(--white)",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? t.generating : t.generate}
        </button>
      </div>

      {meta && (
        <div
          role="note"
          style={{
            ...BODY,
            backgroundColor: "var(--pale-terra)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 12,
          }}
        >
          {meta.disclaimer}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            ...BODY,
            backgroundColor: "var(--pale-terra)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "var(--accent)",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 20,
          minHeight: 220,
        }}
      >
        {!text && !busy && !error && (
          <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{t.empty}</p>
        )}
        {(text || busy) && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid="family-update-text"
            aria-label="Family update text"
            style={{
              ...BODY,
              width: "100%",
              minHeight: 240,
              border: "none",
              outline: "none",
              resize: "vertical",
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text)",
              backgroundColor: "transparent",
            }}
          />
        )}
      </div>

      {(text || busy) && (
        <div className="flex flex-wrap" style={{ gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={copyToClipboard}
            data-action="copy"
            aria-label={t.copy}
            style={actionButton("primary")}
          >
            {t.copy}
          </button>
          <button
            type="button"
            onClick={shareNative}
            data-action="share"
            aria-label={t.share}
            style={actionButton("ghost")}
          >
            {t.share}
          </button>
          <button
            type="button"
            onClick={whatsappShare}
            data-action="whatsapp"
            aria-label={t.whatsapp}
            style={actionButton("accent")}
          >
            {t.whatsapp}
          </button>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{
            ...BODY,
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--text)",
            color: "var(--white)",
            padding: "10px 18px",
            borderRadius: 24,
            fontSize: 14,
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...BODY,
        height: 40,
        padding: "0 18px",
        border: "none",
        backgroundColor: active ? "var(--primary)" : "var(--card)",
        color: active ? "var(--white)" : "var(--text)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function actionButton(variant: "primary" | "ghost" | "accent"): React.CSSProperties {
  const base: React.CSSProperties = {
    ...BODY,
    height: 48,
    padding: "0 20px",
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid var(--border)",
  };
  if (variant === "primary") return { ...base, backgroundColor: "var(--primary)", color: "var(--white)", borderColor: "var(--primary)" };
  if (variant === "accent") return { ...base, backgroundColor: "var(--accent)", color: "var(--white)", borderColor: "var(--accent)" };
  return { ...base, backgroundColor: "var(--card)", color: "var(--text)" };
}
