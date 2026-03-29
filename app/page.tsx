"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UploadCloud, Activity, Search, Menu, X } from "lucide-react";

const AnchorIcon = ({ size = 48, color = "#2C5F4A" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width={size} height={size}>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="8" x2="12" y2="22" />
    <path d="M5 15l7 7 7-7" />
    <path d="M5 12h4M15 12h4" />
  </svg>
);

function smoothScroll(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactEmail.includes("@")) return;
    setContactStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMessage }),
      });
      setContactStatus(res.ok ? "success" : "error");
    } catch {
      setContactStatus("error");
    }
  }
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "How it works", id: "how-it-works" },
    { label: "Research", id: "research" },
    { label: "Our story", id: "our-story" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: "#1A1A1A" }}>
      {/* ═══ NAVIGATION ═══ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "#FFFFFF",
          boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.08)" : "none",
          transition: "box-shadow 0.2s",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <AnchorIcon size={28} />
            <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: 20, color: "#1A1A1A" }}>
              Medalyn
            </span>
          </a>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 32 }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => smoothScroll(link.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 15,
                  color: "#1A1A1A",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/login"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 20,
                border: "1.5px solid #2C5F4A",
                color: "#2C5F4A",
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="hidden md:flex"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 20,
                backgroundColor: "#2C5F4A",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                alignItems: "center",
                textDecoration: "none",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Sign up free
            </Link>
            {/* Mobile hamburger — visible only on mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="block md:hidden"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              {menuOpen ? <X size={24} color="#1A1A1A" /> : <Menu size={24} color="#1A1A1A" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="flex flex-col md:hidden"
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid #E8E2D9",
              padding: "16px 24px",
              gap: 16,
            }}
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  smoothScroll(link.id);
                  setMenuOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#1A1A1A",
                  textAlign: "left",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section
        style={{
          backgroundColor: "#F7F2EA",
          padding: "144px 24px 80px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AnchorIcon size={48} />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(40px, 6vw, 64px)",
            color: "#1A1A1A",
            maxWidth: 700,
            margin: "24px auto 0",
            lineHeight: 1.15,
          }}
        >
          For the family doing everything they can.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#6B6B6B",
            maxWidth: 560,
            margin: "20px auto 0",
            lineHeight: 1.6,
          }}
        >
          Medalyn helps patients and caregivers understand medical documents, track symptoms, find
          clinical trials, and stay connected with their care team. In plain language. At any hour.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 32,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/login?mode=signup"
            style={{
              height: 52,
              padding: "0 32px",
              borderRadius: 26,
              backgroundColor: "#2C5F4A",
              color: "#FFFFFF",
              border: "none",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Sign up free
          </Link>
          <Link
            href="/login"
            style={{
              height: 52,
              padding: "0 32px",
              borderRadius: 26,
              backgroundColor: "transparent",
              color: "#2C5F4A",
              border: "1.5px solid #2C5F4A",
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Sign in
          </Link>
        </div>
        <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 20 }}>
          Built by caregivers, for caregivers.
        </p>
      </section>

      {/* ═══ SECTION 2: THE PROBLEM ═══ */}
      <section id="how-it-works" style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "grid",
            gap: 48,
          }}
          className="md:grid-cols-2"
        >
          <div
            style={{
              borderLeft: "3px solid #C4714A",
              paddingLeft: 24,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontStyle: "italic",
                fontSize: 26,
                color: "#2C5F4A",
                lineHeight: 1.4,
              }}
            >
              &ldquo;He came home with a stack of papers, a bag of medications, and more questions
              than answers.&rdquo;
            </p>
          </div>
          <div style={{ fontSize: 17, color: "#1A1A1A", lineHeight: 1.7 }}>
            <p>
              Serious illness moves fast. The information does not always keep up. Lab results
              arrive without context. Discharge notes are written for clinicians. Medications
              change weekly.
            </p>
            <p style={{ marginTop: 16 }}>
              Caregivers do their best with what they have. Medalyn gives them more.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: THE PRODUCT ═══ */}
      <section id="product" style={{ backgroundColor: "#F7F2EA", padding: "80px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 13,
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            What Medalyn does
          </p>
          <h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 36,
              color: "#1A1A1A",
              marginTop: 8,
            }}
          >
            Tools built for the people in the waiting room.
          </h2>
        </div>

        <div
          style={{
            maxWidth: 1000,
            margin: "48px auto 0",
            display: "grid",
            gap: 24,
          }}
          className="md:grid-cols-3"
        >
          {[
            {
              icon: <UploadCloud size={24} color="#C4714A" />,
              iconBg: "#FDF3EE",
              title: "Understand any document",
              desc: "Upload a discharge summary, lab result, or pathology report. Get a plain-language summary with flagged values highlighted.",
            },
            {
              icon: <Activity size={24} color="#2C5F4A" />,
              iconBg: "#F0F5F2",
              title: "Track what is happening",
              desc: "Log symptoms in 3 minutes. Get a clinical summary your doctor can use. See patterns over time.",
            },
            {
              icon: <Search size={24} color="#C4714A" />,
              iconBg: "#FDF3EE",
              title: "Find trials and options",
              desc: "Search clinical trials matched to your diagnosis and biomarkers. Updated daily from ClinicalTrials.gov.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 28,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: card.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {card.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{card.title}</h3>
              <p style={{ fontSize: 15, color: "#6B6B6B", lineHeight: 1.6 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 4: RESEARCH ═══ */}
      <section id="research" style={{ backgroundColor: "#2C5F4A", padding: "80px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 36,
              color: "#FFFFFF",
            }}
          >
            Your experience could help the next family.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.7,
              marginTop: 20,
            }}
          >
            If you choose, your anonymized medical data can help researchers identify patterns,
            find mutations, and match future patients to clinical trials. Your name and personal
            details are never included. You can change your mind at any time.
          </p>
          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.7,
              marginTop: 16,
            }}
          >
            We built this because the hardest experiences deserve to mean something beyond the
            people who lived them.
          </p>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              fontStyle: "italic",
              marginTop: 16,
            }}
          >
            Data shared only with IRB-approved researchers. Never sold.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 5: THE STORY ═══ */}
      <section id="our-story" style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AnchorIcon size={40} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 32,
              color: "#1A1A1A",
              marginTop: 16,
            }}
          >
            Medalyn was built by caregivers who lived it.
          </h2>
          <p style={{ fontSize: 17, color: "#6B6B6B", lineHeight: 1.8, marginTop: 20 }}>
            We know what it is to sit in a waiting room with the wrong questions. To receive a
            document you cannot understand. To call a number and wait.
          </p>
          <p style={{ fontSize: 17, color: "#6B6B6B", lineHeight: 1.8, marginTop: 16 }}>
            We built Medalyn with the tools we wished we had. For the families who are in it
            right now.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 6: GET IN TOUCH ═══ */}
      <section id="contact" style={{ backgroundColor: "#F7F2EA", padding: "80px 24px" }}>
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 40,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 28,
              color: "#1A1A1A",
              textAlign: "center",
            }}
          >
            Get in touch
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#6B6B6B",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Questions, feedback, or just want to share what you are going through. We would love to hear from you.
          </p>

          <div style={{ marginTop: 32 }}>
            {contactStatus === "success" ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ fontSize: 18, fontWeight: 600, color: "#2C5F4A" }}>
                  Message sent.
                </p>
                <p style={{ fontSize: 15, color: "#6B6B6B", marginTop: 4 }}>
                  We will be in touch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{
                    height: 52, borderRadius: 12, border: "1.5px solid #E8E2D9",
                    padding: "0 16px", fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 16, background: "white", width: "100%",
                    boxSizing: "border-box", outline: "none",
                  }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{
                    height: 52, borderRadius: 12, border: "1.5px solid #E8E2D9",
                    padding: "0 16px", fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 16, background: "white", width: "100%",
                    boxSizing: "border-box", outline: "none",
                  }}
                />
                <textarea
                  placeholder="Your message (optional)"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  style={{
                    borderRadius: 12, border: "1.5px solid #E8E2D9",
                    padding: "12px 16px", fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 16, background: "white", width: "100%",
                    boxSizing: "border-box", outline: "none", resize: "vertical",
                  }}
                />
                <button
                  type="submit"
                  disabled={contactStatus === "sending" || !contactEmail.includes("@")}
                  style={{
                    height: 52, borderRadius: 26, background: "#2C5F4A",
                    color: "white", border: "none", fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 16, fontWeight: 600, cursor: "pointer", width: "100%",
                    opacity: contactStatus === "sending" ? 0.6 : 1,
                  }}
                >
                  {contactStatus === "sending" ? "Sending..." : "Send message"}
                </button>
                {contactStatus === "error" && (
                  <p style={{ fontSize: 14, color: "#C4714A", textAlign: "center" }}>
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer
        style={{
          backgroundColor: "#1A1A1A",
          padding: "40px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AnchorIcon size={24} color="#FFFFFF" />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Medalyn by Cassini Design Group
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Privacy Policy
          </a>
          <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
