import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BREVO_API = "https://api.brevo.com/v3";
const MEDALYN_LIST_NAME = "Medalyn Waitlist";

// Cache the list ID across invocations within the same instance
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

  // Check existing lists for Medalyn Waitlist
  const listsRes = await brevoFetch("/contacts/lists?limit=50");
  if (listsRes.ok) {
    const data = await listsRes.json();
    const existing = data.lists?.find((l: { name: string }) => l.name === MEDALYN_LIST_NAME);
    if (existing) {
      cachedListId = existing.id;
      return existing.id;
    }
  }

  // Create new list
  const createRes = await brevoFetch("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name: MEDALYN_LIST_NAME, folderId: 1 }),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    cachedListId = data.id;
    return data.id;
  }

  // Fallback — try list ID 2 if creation fails
  console.error("Failed to create Brevo list:", await createRes.text());
  return 2;
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    // 1. Save to Supabase waitlist (using anon key for pre-auth)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from("waitlist").insert({ name: name || null, email });

    // 2. Add contact to Brevo in Medalyn Waitlist
    const listId = await getOrCreateList();

    await brevoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: name || "" },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    // 3. Send notification email via Brevo transactional
    await brevoFetch("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        sender: { name: "Medalyn", email: "samira@cassinidesigngroup.com" },
        to: [{ email: "samira@cassinidesigngroup.com", name: "Samira" }],
        subject: "New Medalyn waitlist signup",
        textContent: `Name: ${name || "Not provided"}\nEmail: ${email}`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
