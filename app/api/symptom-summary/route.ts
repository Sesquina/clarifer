import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserFromRequest } from '@/lib/auth/get-user';
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";

export const maxDuration = 60;

const anthropic = new Anthropic();
const ALLOWED_ROLES = ["caregiver", "provider", "admin"];

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const user = await getUserFromRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const organizationId = user.organization_id;

  const { symptoms, severity, notes } = await request.json();

  if (!symptoms) {
    return NextResponse.json({ error: "Missing symptoms" }, { status: 400 });
  }

  const sanitizedSymptoms = stripHtml(String(symptoms));
  const sanitizedNotes = stripHtml(String(notes || "None"));

  if (sanitizedSymptoms.length > 50000) {
    return NextResponse.json({ error: "Content too large. Please shorten your message." }, { status: 400 });
  }

  try {
    const completion = await Promise.race([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        system: "You are a medical symptom summarizer. Given symptoms, severity, and notes, produce a brief 1-2 sentence clinical-style summary suitable for a doctor to quickly review. Be factual and concise.",
        messages: [
          {
            role: "user",
            content: `Symptoms: ${sanitizedSymptoms}\nSeverity: ${severity}/10\nNotes: ${sanitizedNotes}`,
          },
        ],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 25000)
      ),
    ]);

    const summary = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "SELECT",
      resource_type: "symptom_summary",
      organization_id: organizationId,
      ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      status: "success",
    }).then(() => undefined, () => undefined);

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ summary: null });
  }
}
