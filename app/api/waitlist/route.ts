/**
 * app/api/waitlist/route.ts
 * Accepts waitlist signups, stores in Supabase, and notifies Brevo via API.
 * Tables: waitlist
 * Auth: Public
 * HIPAA: No PHI in this file.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";
import { waitlistLimiter } from "@/lib/ratelimit";

const BREVO_API = "https://api.brevo.com/v3";
const CLARIFER_LIST_NAME = "Clarifer Waitlist";

let cachedListId: number | null = null;

async function brevoFetch(path: string, options: RequestInit = {}) {
  return fetch(`${BREVO_API}${path}`, {
    ...options,
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

async function getOrCreateList(): Promise<number> {
  if (cachedListId) return cachedListId;

  const listsRes = await brevoFetch("/contacts/lists?limit=50");
  if (listsRes.ok) {
    const data = await listsRes.json();
    const existing = data.lists?.find((l: { name: string }) => l.name === CLARIFER_LIST_NAME);
    if (existing) {
      cachedListId = existing.id;
      return existing.id;
    }
  }

  const createRes = await brevoFetch("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name: CLARIFER_LIST_NAME, folderId: 1 }),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    cachedListId = data.id;
    return data.id;
  }

  return 2;
}

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

    const listId = await getOrCreateList();

    const contactRes = await brevoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify({
        email: safeEmail,
        attributes: {
          FIRSTNAME: safeName ?? "",
          LASTNAME: safeLastName ?? "",
          LANGUAGE_PREFERENCE: safeLang,
          CARING_FOR: safeCaringFor ?? "",
          CHALLENGES: safeChallenges.join(", "),
          WHY_CLARIFER: safeWhyClarifer ?? "",
          MARKETING_OPTIN: safeMarketingOptin ? "1" : "0",
        },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (!contactRes.ok) {
      const errBody = await contactRes.text().catch(() => "");
      console.error("[waitlist] Brevo /contacts failed:", contactRes.status, errBody);
      return NextResponse.json(
        { error: "Signup failed. Please try again." },
        { status: 500 }
      );
    }

    const emailRes = await brevoFetch("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        sender: { name: "Clarifer", email: "team@clarifer.com" },
        to: [
          { email: "team@clarifer.com", name: "Clarifer" },
          { email: "michael.barbara@clarifer.com", name: "Michael" },
        ],
        subject: "New Clarifer waitlist signup",
        textContent: [
          `Name: ${safeName ?? "Not provided"} ${safeLastName ?? ""}`.trim(),
          `Email: ${safeEmail}`,
          `Language: ${safeLang}`,
          `Caring for: ${safeCaringFor ?? "Not selected"}`,
          `Challenges: ${safeChallenges.join(", ") || "None selected"}`,
          `Why Clarifer: ${safeWhyClarifer ?? "Not provided"}`,
          `Marketing opt-in: ${safeMarketingOptin ? "Yes" : "No"}`,
        ].join("\n"),
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text().catch(() => "");
      console.error("[waitlist] Brevo /smtp/email failed:", emailRes.status, errBody);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
