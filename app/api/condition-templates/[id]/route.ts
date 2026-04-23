/**
 * GET /api/condition-templates/[id]
 * Returns a condition template by ID.
 * Auth: authenticate → return template fields.
 * No PHI involved — templates are configuration data.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userRecord?.organization_id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const { data: template } = await supabase
    .from("condition_templates")
    .select("id, name, category, ai_context, symptom_questions, symptom_vocabulary, trial_filters, is_active")
    .eq("id", id)
    .single();

  if (!template) {
    return NextResponse.json(
      { error: "Condition template not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json(template);
}
