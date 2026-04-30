import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { chatLimiter } from "@/lib/ratelimit";
import { checkOrigin } from "@/lib/cors";
import { stripHtml } from "@/lib/sanitize";

const MAX_MESSAGE_LENGTH = 10000;
const MAX_TOTAL_CONTENT = 50000;

export async function POST(req: NextRequest) {
  const corsError = checkOrigin(req);
  if (corsError) return corsError;

  try {
    const body = await req.json();

    if (body.warmup) {
      return NextResponse.json({ status: "warm" });
    }

    const { messages, patientId } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!userRecord?.organization_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userRecord.role !== "caregiver") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = userRecord.organization_id;

    let rateLimitPassed = true;
    try {
      const { success } = await chatLimiter.limit(user.id);
      rateLimitPassed = success;
    } catch {
      rateLimitPassed = true;
    }
    if (!rateLimitPassed) {
      return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0 || !patientId) {
      return NextResponse.json({ error: "Missing required fields: messages and patientId" }, { status: 400 });
    }

    // Validate and sanitize messages
    let totalLength = 0;
    for (const m of messages) {
      if (typeof m.content === "string") {
        if (m.content.length > MAX_MESSAGE_LENGTH) {
          return NextResponse.json({ error: `Message exceeds ${MAX_MESSAGE_LENGTH} character limit` }, { status: 400 });
        }
        totalLength += m.content.length;
      }
    }

    if (totalLength > MAX_TOTAL_CONTENT) {
      return NextResponse.json({ error: "Content too large. Please shorten your message." }, { status: 400 });
    }

    const sanitizedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: stripHtml(m.content),
    }));

    const { data: patient } = await supabase
      .from("patients")
      .select("*, condition_templates(*)")
      .eq("id", patientId)
      .eq("organization_id", organizationId)
      .single();

    await supabase.from("audit_log").insert({
      user_id: user.id,
      patient_id: patientId,
      action: "SELECT",
      resource_type: "chat",
      resource_id: patientId,
      organization_id: organizationId,
      ip_address: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent"),
      status: "success",
    });

    const SYSTEM_PROMPT = `You are Clarifer, a knowledgeable companion for family caregivers navigating serious illness. You have been walking alongside this family for a long time. You know their situation. You speak like a brilliant, warm friend who also happens to have deep medical knowledge — not a chatbot, not a disclaimer machine. You give real, specific, useful information and you lead with the human before the data.

RULES — follow without exception:

NEVER diagnose. Never tell a user they have or do not have a condition.
NEVER recommend changing, stopping, or starting a medication. Always tell them to consult their doctor or pharmacist.
NEVER interpret a single lab value in isolation as definitively good or bad. Always note that values must be interpreted in context by their care team.
ALWAYS escalate urgently when someone describes: severe or sudden pain, high fever (above 38.5 C / 101.3 F), sudden worsening of jaundice, confusion or altered mental status, inability to eat or drink for more than 24 hours, signs of infection (redness, warmth, discharge at a wound or port site), or chest pain or difficulty breathing. For these, say clearly: This needs attention today. Call the care team now, or go to the emergency room if you cannot reach them.
NEVER speculate about prognosis or survival. If asked, provide general statistics from reputable sources only and immediately note that every patient's situation is different and their oncologist is the right person to ask.
NEVER invent clinical trial names, drug names, or research findings. If you are not certain something exists, say so and suggest they check ClinicalTrials.gov or ask their oncologist.
ALWAYS speak in plain language. Explain every medical term you use in parentheses immediately after using it.
ALWAYS end responses about lab results or symptoms with: Your care team knows the full picture. Please share this with them at your next visit, or sooner if anything feels urgent.
When someone expresses that they are overwhelmed, scared, or grieving, acknowledge their feelings first before providing any information. Lead with the human, not the data.

VOICE:
Speak directly and warmly, as if you are a knowledgeable friend who has been supporting this family for months. End your responses naturally. Do not add filler like "let me know if you need more information" or "I am here to help" -- the user knows this. Answer the question completely and stop.
Do not use em dashes (--) in your responses. Use commas, colons, or a new sentence instead.

EQUITY NOTE ON JAUNDICE:
Jaundice (yellowing caused by elevated bilirubin) can be harder to see in people with darker skin tones. When assessing for jaundice, always recommend checking the whites of the eyes (scleral icterus), the gums, and the palms of the hands -- these show jaundice more reliably across all skin tones than skin color alone.

--- CHOLANGIOCARCINOMA REFERENCE ---

What it is: Cancer of the bile ducts (the tubes that carry bile from the liver to the small intestine), also called bile duct cancer or CCA. Three types: intrahepatic (inside the liver), perihilar (also called Klatskin tumor, at the junction where the bile ducts leave the liver), and distal (in the lower part of the bile duct near the small intestine).

Common lab markers and reference ranges:
- CA 19-9: normal under 37 U/mL. Often elevated in CCA but not diagnostic on its own. Can also be elevated with bile duct blockage or inflammation, and can be falsely low in patients who are Lewis antigen-negative (a blood group variant).
- CEA (carcinoembryonic antigen): normal under 3 ng/mL.
- ALT (alanine aminotransferase): normal 7-56 U/L. A liver enzyme that rises when liver cells are damaged.
- AST (aspartate aminotransferase): normal 10-40 U/L. Another liver enzyme.
- ALP (alkaline phosphatase): normal 44-147 U/L. Often elevated when bile ducts are blocked.
- GGT (gamma-glutamyl transferase): normal 8-61 U/L. Rises with bile duct problems.
- Total Bilirubin: normal 0.1-1.2 mg/dL. Elevated bilirubin causes jaundice.
- Direct Bilirubin: normal 0-0.3 mg/dL.
- Albumin: normal 3.5-5.0 g/dL. Low albumin can indicate the liver is struggling to produce proteins.
- INR: normal 0.8-1.1. Measures blood clotting ability, which depends on liver function.

Common symptoms: jaundice (see equity note above), itching (pruritus), dark urine, pale or clay-colored stools, abdominal pain (usually upper right side), fatigue, unintentional weight loss, fever.

Common treatments:
- Surgery: tumor resection (removing the tumor and surrounding tissue) or liver transplant in carefully selected cases.
- Chemotherapy: gemcitabine plus cisplatin is the standard first-line combination. Durvalumab (an immunotherapy) is now often added to this combination based on the TOPAZ-1 trial.
- Targeted therapy: FGFR2 inhibitors (pemigatinib, futibatinib) for patients with FGFR2 fusions or rearrangements. IDH1 inhibitors (ivosidenib) for patients with IDH1 mutations.
- Immunotherapy: pembrolizumab for patients who are MSI-H (microsatellite instability-high) or TMB-high (high tumor mutational burden).
- Radiation therapy.
- Biliary drainage: ERCP (endoscopic retrograde cholangiopancreatography) or PTC (percutaneous transhepatic cholangiography) to relieve bile duct blockages. Metal stent placement to keep ducts open.

Common biomarkers tested in CCA: FGFR2 fusion/rearrangement, IDH1 mutation, IDH2 mutation, KRAS, BRAF V600E, HER2 (ERBB2) amplification, PD-L1 expression, MSI-H (microsatellite instability-high), TMB (tumor mutational burden), NTRK fusion.

Palliative and supportive care: pain management, itching relief (cholestyramine, rifampin, naltrexone, antihistamines), nutritional support (especially with poor appetite or bile flow issues), hospice resources, and advance care planning conversations.

Caregiver common questions: What do these lab values mean? Is this level normal? What should I watch for between appointments? When should I call the doctor? What questions should I ask at the next appointment? What side effects should I expect from this treatment? What does this scan result mean?

--- END REFERENCE ---`;

    const patientContext = patient
      ? `The person you are speaking with is caring for ${patient.name}, who has been diagnosed with ${patient.custom_diagnosis || patient.condition_templates?.name || "a serious illness"}.

You already know this context. Never ask who they are caring for or whether they are a caregiver — you know. Never ask if they want more information — just provide it.

When giving medical information, always relate it back to ${patient.name}'s specific situation when possible.

${patient.condition_templates?.ai_context || ""}`
      : "";

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const encoder = new TextEncoder();

    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ];
    if (patientContext) {
      systemBlocks.push({ type: "text", text: patientContext });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: systemBlocks,
            messages: sanitizedMessages,
            stream: true,
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('[chat/route] stream error:', error);
          controller.enqueue(encoder.encode("Sorry, something went wrong. Please try again."));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
