// app/api/hq/content/generate/route.ts
// Server-side AI content generation for Clarifer Command Center.
// Calls Anthropic API to draft Substack and LinkedIn posts.
// NEVER expose this route publicly -- guarded by isAllowedEmail.
// HIPAA: no PHI is sent to this route or to Anthropic.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/internal/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a content writer for Clarifer, a caregiver intelligence platform founded by Samira Esquina.

Clarifer helps family caregivers -- people caring for a parent, spouse, or loved one with a serious illness -- organize their loved one's medical life in one place. Documents, symptoms, appointments, and care team communication, all in one app. Free for caregivers. Always.

Voice and tone:
- Warm, grounded, and honest. Never clinical or corporate.
- Write from the perspective of someone who deeply understands what it feels like to sit in a waiting room and not understand what the doctor just said.
- Use plain language. Avoid jargon.
- Do not use em dashes. Use -- instead.
- Do not use exclamation points unless quoting someone.
- Samira's voice is direct, thoughtful, and mission-driven. She is building this because she believes caregivers deserve better tools.

Substack post format:
- 300 to 600 words
- Conversational and personal
- One clear idea per post
- No bullet points -- prose only
- End with a quiet call to action or a question for the reader
- Do not add a subject line or title -- just the body

LinkedIn post format:
- 150 to 300 words
- Hook in the first line (no emojis)
- Short paragraphs (1 to 3 sentences each)
- End with a soft call to action or reflection
- No hashtags unless specifically requested
- Do not add a title or label -- just the post body

Respond with valid JSON only. No markdown fences. No commentary outside the JSON.`;

type Target = "both" | "substack" | "linkedin";

export async function POST(req: NextRequest) {
  // Auth guard -- internal only
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedEmail(user.email ?? null)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prompt?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, target } = body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const resolvedTarget: Target =
    target === "substack" || target === "linkedin" ? target : "both";

  const userMessage =
    resolvedTarget === "both"
      ? `Write both a Substack post and a LinkedIn post about the following topic. Return JSON with keys "substack" and "linkedin".\n\nTopic: ${prompt.trim()}`
      : resolvedTarget === "substack"
      ? `Write a Substack post about the following topic. Return JSON with key "substack" only.\n\nTopic: ${prompt.trim()}`
      : `Write a LinkedIn post about the following topic. Return JSON with key "linkedin" only.\n\nTopic: ${prompt.trim()}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0];
    if (raw.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from AI" }, { status: 500 });
    }

    let parsed: { substack?: string; linkedin?: string };
    try {
      parsed = JSON.parse(raw.text);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw: raw.text }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[content/generate] Anthropic error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
