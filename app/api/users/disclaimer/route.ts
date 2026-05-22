import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

export async function POST(req: NextRequest) {
  const corsError = checkOrigin(req);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ disclaimer_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to record disclaimer acceptance" }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "ACCEPT_DISCLAIMER",
    resource_type: "users",
    resource_id: user.id,
    organization_id: null,
    ip_address: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
    user_agent: req.headers.get("user-agent"),
    status: "success",
  });

  return NextResponse.json({ success: true });
}
