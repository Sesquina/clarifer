/**
 * app/waitlist/page.tsx
 * Pre-launch waitlist signup with EN/ES full translation and dual-submit to Brevo + /api/waitlist.
 * Tables: waitlist (via POST /api/waitlist)
 * Auth: Public
 * HIPAA: No PHI in this file.
 */
"use client";

import { useState, useEffect } from "react";

type Lang = "en" | "es";

const BREVO_URL =
  "https://13337e95.sibforms.com/serve/MUIFAII73sNbygT6lqh7pgMAzR8GPqEEiXteIXyDdNg0ORCyvtjuUPEVh60sWXdfohbElKFMyLFExFFjqsMvYxQAhZs38k99HFvZX_PENGsusQdW8ImB4LbA0uZcDPpK8Jdasz9dTi2Buq_RNhdCG1OEeOtRN9T8fV1QNVf2wUm-Lanbhxe-3nCtTc2vvLRZBTFUtFfSen3fLBwVgA==";

const WHO_OPTIONS = [
  { en: "Parent", es: "Padre o madre", value: "Parent" },
  { en: "Spouse or partner", es: "Pareja", value: "Spouse or partner" },
  { en: "Child", es: "Hijo o hija", value: "Child" },
  { en: "Sibling", es: "Hermano o hermana", value: "Sibling" },
  { en: "Friend", es: "Amigo o amiga", value: "Friend" },
  { en: "Other", es: "Otro", value: "Other" },
];

const CHALLENGE_OPTIONS = [
  { en: "Family updates", es: "Actualizaciones familiares", value: "Coordinating family updates" },
  { en: "Organizing documents", es: "Organizar documentos", value: "Keeping documents organized" },
  { en: "Appointment questions", es: "Preguntas para citas médicas", value: "Knowing what to ask at appointments" },
  { en: "Medications", es: "Medicamentos", value: "Managing medications" },
  { en: "Emergency prep", es: "Preparación para emergencias", value: "Staying prepared for emergencies" },
  { en: "Tracking symptoms", es: "Rastrear síntomas", value: "Tracking symptoms" },
  { en: "Medical language", es: "Lenguaje médico", value: "Understanding medical language" },
];

interface CopySet {
  heading: string;
  sub: string;
  nameLabel: string;
  firstPlaceholder: string;
  lastPlaceholder: string;
  emailLabel: string;
  whoLabel: string;
  hardLabel: string;
  whyLabel: string;
  whyOptional: string;
  whyPlaceholder: string;
  optinText: string;
  button: string;
  buttonLoading: string;
  privacy: string;
  privacyLink: string;
  errorBanner: string;
  successHeading: string;
  successBody: string;
}

const COPY: Record<Lang, CopySet> = {
  en: {
    heading: "Caring for someone you love is hard. We will help you organize it.",
    sub: "Clarifer is free for caregivers, always. We are launching June 2026. Join us when we do.",
    nameLabel: "Your name",
    firstPlaceholder: "First name",
    lastPlaceholder: "Last name",
    emailLabel: "Email address",
    whoLabel: "Who are you caring for?",
    hardLabel: "What feels hardest right now?",
    whyLabel: "What brought you here?",
    whyOptional: "(optional)",
    whyPlaceholder: "One line is enough.",
    optinText:
      "Yes, send me updates from Clarifer. Launch news and occasional notes built for caregivers. I can unsubscribe anytime.",
    button: "Join the community",
    buttonLoading: "Joining...",
    privacy: "Your information stays with us. We will never sell it.",
    privacyLink: "Read our Caregiver Promise.",
    errorBanner: "Please fill in your name and email to continue.",
    successHeading: "You are in.",
    successBody:
      "Thank you for joining us. We will be in touch before launch. Watch for a welcome note in your inbox.",
  },
  es: {
    heading: "Cuidar a alguien que amas es difícil. Te ayudaremos a organizarlo.",
    sub: "Clarifer es gratis para cuidadores, siempre. Lanzamos en junio 2026. Únete cuando lo hagamos.",
    nameLabel: "Tu nombre",
    firstPlaceholder: "Nombre",
    lastPlaceholder: "Apellido",
    emailLabel: "Correo electrónico",
    whoLabel: "¿A quién cuidas?",
    hardLabel: "¿Qué se siente más difícil ahora?",
    whyLabel: "¿Qué te trajo aquí?",
    whyOptional: "(opcional)",
    whyPlaceholder: "Una línea es suficiente.",
    optinText:
      "Sí, envíame actualizaciones de Clarifer. Noticias de lanzamiento y notas para cuidadores. Puedo darme de baja cuando quiera.",
    button: "Unirme a la comunidad",
    buttonLoading: "Enviando...",
    privacy: "Tu información se queda con nosotros. Nunca la venderemos.",
    privacyLink: "Lee nuestra Promesa al Cuidador.",
    errorBanner: "Por favor ingresa tu nombre y correo para continuar.",
    successHeading: "Ya estás dentro.",
    successBody:
      "Gracias por unirte. Te contactaremos antes del lanzamiento. Espera una nota de bienvenida en tu correo.",
  },
};

export default function WaitlistPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [isMobile, setIsMobile] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [caringFor, setCaringFor] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [whyText, setWhyText] = useState("");
  const [optin, setOptin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [whyFocused, setWhyFocused] = useState(false);
  const [optinHover, setOptinHover] = useState(false);

  // Browser language detection
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language?.startsWith("es")) {
      setLang("es");
    }
  }, []);

  // Viewport detection for responsive layout
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const c = COPY[lang];

  const toggleChallenge = (value: string) => {
    setChallenges((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    const fNameOk = firstName.trim().length > 0;
    const emailOk = email.trim().length > 0;

    if (!fNameOk || !emailOk) {
      setFirstNameError(!fNameOk);
      setEmailError(!emailOk);
      setShowError(true);
      return;
    }

    setFirstNameError(false);
    setEmailError(false);
    setShowError(false);
    setLoading(true);

    // Brevo direct form POST — fire-and-forget, mode no-cors
    try {
      const fd = new FormData();
      fd.append("FIRSTNAME", firstName);
      fd.append("LASTNAME", lastName);
      fd.append("EMAIL", email);
      fd.append("LANGUAGE_PREFERENCE", lang === "en" ? "1" : "2");
      if (caringFor) fd.append("CARING_FOR", caringFor);
      challenges.forEach((v) => fd.append("CHALLENGE[]", v));
      fd.append("WHY_CLARIFER", whyText);
      fd.append("MARKETING_OPTIN", optin ? "1" : "");
      fd.append("email_address_check", "");
      fd.append("locale", "en");
      fetch(BREVO_URL, { method: "POST", body: fd, mode: "no-cors" });
    } catch {
      // fire-and-forget, ignore failures
    }

    // Internal API POST
    fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        languagePreference: lang,
        caringFor,
        challenges,
        whyClarifer: whyText,
        marketingOptin: optin,
      }),
    }).catch((err) => console.error("[waitlist] API failed:", err));

    setSuccess(true);
    setLoading(false);
  };

  // ─── Shared style constants ───────────────────────────────────────────────
  const sage = "#2c5f4a";
  const border = "#e8e2d9";
  const cardBg = "#ffffff";
  const textColor = "#1a1a1a";
  const mutedColor = "#6b6b6b";
  const pageBg = "#f7f2ea";
  const paleSage = "#f0f5f2";
  const cardPad = isMobile ? "28px 24px" : "40px 36px";

  const inputBase = (focused: boolean, error: boolean): React.CSSProperties => ({
    height: 48,
    border: error
      ? "2px solid #E24B4A"
      : focused
      ? `2px solid ${sage}`
      : `1.5px solid ${border}`,
    borderRadius: 10,
    padding: "0 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: textColor,
    backgroundColor: error ? "#fff8f8" : focused ? paleSage : cardBg,
    outline: "none",
    transition: "border-color 100ms, background 100ms",
    width: "100%",
    boxSizing: "border-box" as const,
  });

  const sectionLabel: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: mutedColor,
    marginBottom: 8,
    marginTop: 0,
  };

  // ─── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        style={{
          backgroundColor: pageBg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            backgroundColor: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: cardPad,
          }}
        >
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: paleSage,
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={sage}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 22,
                color: textColor,
                marginBottom: 8,
                marginTop: 0,
              }}
            >
              {c.successHeading}
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: mutedColor,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {c.successBody}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Placeholder + hover rules that can't be expressed as inline styles */}
      <style>{`
        .wl-input::placeholder,
        .wl-textarea::placeholder { color: #9b9b9b; }
        .wl-pill:hover:not([data-selected="true"]) { border-color: #2c5f4a !important; color: #2c5f4a !important; }
        .wl-chip:hover:not([data-selected="true"]) { border-color: #2c5f4a !important; }
      `}</style>

      <div
        style={{
          backgroundColor: pageBg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            backgroundColor: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: cardPad,
          }}
        >
          {/* ── Top row: logo + lang toggle ─────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: sage,
                  borderRadius: 7,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/logo-mark.png"
                  alt="Clarifer"
                  width={28}
                  height={28}
                  style={{ objectFit: "contain", display: "block" }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: sage,
                }}
              >
                Clarifer
              </span>
            </div>

            <div
              style={{
                display: "flex",
                border: `1px solid ${border}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {(["en", "es"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  style={{
                    padding: "7px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: lang === l ? sage : "transparent",
                    color: lang === l ? cardBg : mutedColor,
                    transition: "all 100ms",
                  }}
                >
                  {l === "en" ? "EN" : "ES"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Heading ─────────────────────────────────────────────────── */}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: isMobile ? 22 : 24,
              color: sage,
              lineHeight: 1.25,
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            {c.heading}
          </h1>

          {/* ── Subtext ─────────────────────────────────────────────────── */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: mutedColor,
              lineHeight: 1.6,
              marginBottom: 28,
              marginTop: 0,
            }}
          >
            {c.sub}
          </p>

          {/* ── Divider ─────────────────────────────────────────────────── */}
          <hr style={{ border: "none", borderTop: `1px solid ${border}`, margin: "0 0 24px 0" }} />

          {/* ── Name row ────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <p style={sectionLabel}>{c.nameLabel}</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
              }}
            >
              <input
                className="wl-input"
                type="text"
                placeholder={c.firstPlaceholder}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={() => setFirstNameFocused(true)}
                onBlur={() => setFirstNameFocused(false)}
                style={inputBase(firstNameFocused, firstNameError)}
              />
              <input
                className="wl-input"
                type="text"
                placeholder={c.lastPlaceholder}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={() => setLastNameFocused(true)}
                onBlur={() => setLastNameFocused(false)}
                style={inputBase(lastNameFocused, false)}
              />
            </div>
          </div>

          {/* ── Email ───────────────────────────────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <p style={sectionLabel}>{c.emailLabel}</p>
            <input
              className="wl-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={inputBase(emailFocused, emailError)}
            />
          </div>

          {/* ── Who are you caring for (pills) ──────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <p style={sectionLabel}>{c.whoLabel}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {WHO_OPTIONS.map((opt) => {
                const selected = caringFor === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className="wl-pill"
                    data-selected={selected ? "true" : "false"}
                    onClick={() => setCaringFor(selected ? "" : opt.value)}
                    style={{
                      padding: "9px 16px",
                      border: selected
                        ? `1.5px solid ${sage}`
                        : `1.5px solid ${border}`,
                      borderRadius: 20,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 13,
                      color: selected ? cardBg : textColor,
                      backgroundColor: selected ? sage : cardBg,
                      cursor: "pointer",
                      transition: "all 100ms",
                      lineHeight: 1,
                    }}
                  >
                    {opt[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── What feels hardest (chips) ───────────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <p style={sectionLabel}>{c.hardLabel}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CHALLENGE_OPTIONS.map((opt) => {
                const selected = challenges.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className="wl-chip"
                    data-selected={selected ? "true" : "false"}
                    onClick={() => toggleChallenge(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      border: selected
                        ? `1.5px solid ${sage}`
                        : `1.5px solid ${border}`,
                      borderRadius: 20,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: selected ? 500 : 400,
                      fontSize: 13,
                      color: selected ? "#185040" : textColor,
                      backgroundColor: selected ? paleSage : cardBg,
                      cursor: "pointer",
                      transition: "all 100ms",
                      lineHeight: 1,
                    }}
                  >
                    {/* Check indicator */}
                    <span
                      style={{
                        position: "relative",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: selected ? `1.5px solid ${sage}` : "1.5px solid #d0ccc6",
                        backgroundColor: selected ? sage : "transparent",
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 100ms",
                      }}
                    >
                      {selected && (
                        <span
                          style={{
                            display: "block",
                            width: 5,
                            height: 3,
                            borderLeft: "1.5px solid #ffffff",
                            borderBottom: "1.5px solid #ffffff",
                            transform: "rotate(-45deg) translateY(-1px)",
                          }}
                        />
                      )}
                    </span>
                    {opt[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Why (optional textarea) ─────────────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <p style={sectionLabel}>
              {c.whyLabel}{" "}
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                  fontSize: 11,
                  color: "#9b9b9b",
                }}
              >
                {c.whyOptional}
              </span>
            </p>
            <textarea
              className="wl-textarea"
              placeholder={c.whyPlaceholder}
              value={whyText}
              onChange={(e) => setWhyText(e.target.value)}
              onFocus={() => setWhyFocused(true)}
              onBlur={() => setWhyFocused(false)}
              style={{
                width: "100%",
                border: whyFocused ? `2px solid ${sage}` : `1.5px solid ${border}`,
                borderRadius: 10,
                padding: "12px 14px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: textColor,
                backgroundColor: whyFocused ? paleSage : cardBg,
                resize: "none",
                height: 72,
                outline: "none",
                transition: "border-color 100ms, background 100ms",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* ── Opt-in toggle ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 22 }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOptin((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOptin((v) => !v);
              }}
              onMouseEnter={() => setOptinHover(true)}
              onMouseLeave={() => setOptinHover(false)}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "14px 16px",
                backgroundColor: optinHover ? "#eee8df" : pageBg,
                borderRadius: 10,
                cursor: "pointer",
                transition: "background 100ms",
              }}
            >
              {/* Toggle track */}
              <div
                style={{
                  width: 40,
                  height: 24,
                  borderRadius: 12,
                  position: "relative",
                  backgroundColor: optin ? sage : "#d0ccc6",
                  transition: "background 150ms",
                  flexShrink: 0,
                }}
              >
                {/* Knob */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: cardBg,
                    position: "absolute",
                    top: 3,
                    left: optin ? 19 : 3,
                    transition: "left 150ms",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: mutedColor,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {c.optinText}
              </p>
            </div>
          </div>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {showError && (
            <div
              style={{
                backgroundColor: "#fff0f0",
                border: "1px solid #E24B4A",
                borderRadius: 10,
                padding: "10px 14px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#A32D2D",
                marginBottom: 16,
              }}
            >
              {c.errorBanner}
            </div>
          )}

          {/* ── Submit button ────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#245040";
            }}
            onMouseOut={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = sage;
            }}
            onMouseDown={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
            style={{
              width: "100%",
              height: 52,
              backgroundColor: loading ? "#b0b0b0" : sage,
              color: cardBg,
              border: "none",
              borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 20,
              transition: "background 100ms, transform 80ms",
            }}
          >
            {loading ? c.buttonLoading : c.button}
          </button>

          {/* ── Privacy note ─────────────────────────────────────────────── */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "#818080",
              textAlign: "center",
              marginTop: 14,
              lineHeight: 1.5,
              marginBottom: 0,
            }}
          >
            {c.privacy}{" "}
            <a href="/promise" style={{ color: "#c4714a", textDecoration: "underline" }}>
              {c.privacyLink}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
