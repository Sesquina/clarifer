/**
 * app/api/waitlist/route.ts
 * Accepts waitlist signups, stores in Supabase, and sends a team notification via SMTP.
 * Brevo list subscription is handled client-side via direct form POST (no-cors).
 * Tables: waitlist
 * Auth: Public
 * HIPAA: No PHI in this file.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";
import { waitlistLimiter } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  // Rate limit: 3 signups per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { success: rateLimitOk } = await waitlistLimiter.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const {
      firstName,
      lastName,
      email,
      languagePreference,
      caringFor,
      challenges,
      whyClarifer,
      marketingOptin,
    } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const safeName = firstName ? stripHtml(String(firstName)).slice(0, 200) : null;
    const safeLastName = lastName ? stripHtml(String(lastName)).slice(0, 200) : null;
    const safeEmail = stripHtml(String(email)).slice(0, 320);
    const safeLang = languagePreference === "es" ? "es" : "en";
    const safeCaringFor = caringFor ? stripHtml(String(caringFor)).slice(0, 200) : null;
    const safeChallenges: string[] = Array.isArray(challenges)
      ? challenges.map((c: unknown) => stripHtml(String(c)).slice(0, 200))
      : [];
    const safeWhyClarifer = whyClarifer ? stripHtml(String(whyClarifer)).slice(0, 2000) : null;
    const safeMarketingOptin = Boolean(marketingOptin);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from("waitlist").insert({
      name: safeName,
      last_name: safeLastName,
      email: safeEmail,
      language_preference: safeLang,
      caring_for: safeCaringFor,
      challenges: safeChallenges,
      why_clarifer: safeWhyClarifer,
      marketing_optin: safeMarketingOptin,
    });

    const textContent = [
      `Name: ${safeName ?? "Not provided"} ${safeLastName ?? ""}`.trim(),
      `Email: ${safeEmail}`,
      `Language: ${safeLang}`,
      `Caring for: ${safeCaringFor ?? "Not selected"}`,
      `Challenges: ${safeChallenges.join(", ") || "None selected"}`,
      `Why Clarifer: ${safeWhyClarifer ?? "Not provided"}`,
      `Marketing opt-in: ${safeMarketingOptin ? "Yes" : "No"}`,
    ].join("\n");

    // Transporter created inside handler — serverless functions must not share state
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: "Clarifer <team@clarifer.com>",
        to: ["team@clarifer.com", "samira.esquina@clarifer.com", "michael.barbara@clarifer.com"],
        subject: "New Clarifer waitlist signup",
        text: textContent,
      });
      console.log("[waitlist] SMTP notification sent to team for:", safeEmail);
    } catch (smtpErr) {
      // Signup already succeeded — Supabase insert is done, client-side Brevo form posted.
      // Log the failure and continue; do not block the caregiver's confirmation.
      console.error("[waitlist] SMTP notification failed:", smtpErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
