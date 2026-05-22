import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkOrigin } from "@/lib/cors";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function POST(request: Request) {
  const corsError = checkOrigin(request);
  if (corsError) return corsError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let firstName: string;
  let email: string;
  try {
    const body = await request.json();
    firstName = (body.firstName ?? "").trim() || "there";
    email = (body.email ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F7F2EA;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F2EA;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:8px;border:1px solid #E8E2D9;overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="background-color:#2C5F4A;padding:32px 40px;text-align:center;">
        <span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Clarifer</span>
      </td></tr>
      <tr><td style="padding:40px 40px 32px;">
        <p style="font-size:26px;font-weight:700;color:#2C5F4A;margin:0 0 8px;line-height:1.2;font-family:Georgia,serif;">You are in.</p>
        <p style="font-size:15px;color:#6B6B6B;margin:0 0 28px;line-height:1.6;">Welcome to Clarifer, ${firstName}. You just took a real step toward making caregiving a little more manageable. We built this for families like yours.</p>
        <p style="font-size:13px;font-weight:600;color:#1A1A1A;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">Here is what to do first</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr><td style="background-color:#F0F5F2;border-radius:8px;padding:20px 24px;border-left:3px solid #2C5F4A;">
            <p style="font-size:15px;font-weight:600;color:#2C5F4A;margin:0 0 4px;">Upload a medical document</p>
            <p style="font-size:14px;color:#6B6B6B;margin:0;line-height:1.5;">A discharge summary, lab result, or prescription. Clarifer will read it and give you a plain-language summary you can actually understand and share.</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td style="background-color:#FDF3EE;border-radius:8px;padding:20px 24px;border-left:3px solid #C4714A;">
            <p style="font-size:15px;font-weight:600;color:#C4714A;margin:0 0 4px;">Ask Clarifer a question</p>
            <p style="font-size:14px;color:#6B6B6B;margin:0;line-height:1.5;">Anything on your mind about the care situation. Clarifer will give you a real answer, not a disclaimer.</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td align="center">
            <a href="https://clarifer.com/home" style="display:inline-block;background-color:#2C5F4A;color:#FFFFFF;font-size:16px;font-weight:600;padding:14px 40px;border-radius:100px;text-decoration:none;">Go to my dashboard</a>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="border-top:1px solid #E8E2D9;padding-top:24px;">
            <p style="font-size:14px;color:#6B6B6B;margin:0;line-height:1.6;">Clarifer is free for caregivers. Always.</p>
            <p style="font-size:14px;color:#2C5F4A;font-weight:600;margin:4px 0 0;">The Clarifer Team</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background-color:#F7F2EA;padding:20px 40px;border-top:1px solid #E8E2D9;text-align:center;">
        <p style="font-size:12px;color:#6B6B6B;margin:0;line-height:1.6;">You are receiving this because you created a Clarifer account.<br>Clarifer is not a medical device and does not replace professional medical advice.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY ?? "",
      },
      body: JSON.stringify({
        sender: { name: "Clarifer", email: "team@clarifer.com" },
        to: [{ email, name: firstName }],
        subject: "You are in. Here is how to get started.",
        htmlContent,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
