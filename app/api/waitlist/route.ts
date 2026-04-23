import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";

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

  try {
    const { name, email, message } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    // Sanitize all inputs
    const safeName = name ? stripHtml(String(name)).slice(0, 200) : null;
    const safeEmail = stripHtml(String(email)).slice(0, 320);
    const safeMessage = message ? stripHtml(String(message)).slice(0, 2000) : undefined;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from("waitlist").insert({ name: safeName, email: safeEmail });

    const listId = await getOrCreateList();

    await brevoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify({
        email: safeEmail,
        attributes: { FIRSTNAME: safeName || "" },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    await brevoFetch("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        sender: { name: "Clarifer", email: "samira@cassinidesigngroup.com" },
        to: [{ email: "samira@cassinidesigngroup.com", name: "Samira" }],
        subject: safeMessage ? "New Clarifer contact message" : "New Clarifer waitlist signup",
        textContent: `Name: ${safeName || "Not provided"}\nEmail: ${safeEmail}${safeMessage ? `\nMessage: ${safeMessage}` : ""}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
