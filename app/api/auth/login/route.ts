/**
 * app/api/auth/login/route.ts
 * Real user login via Keycloak ROPC grant.
 * Sets clarifer_token cookie (HttpOnly, Secure, SameSite=Lax).
 * HIPAA: no PHI. Logs auth events only.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { keycloakLogin } from "@/lib/auth/keycloak-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const password = body.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const tokens = await keycloakLogin(email, password);
    if (!tokens) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set("clarifer_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });
    console.log("[auth/login] success for:", email.slice(0, 3) + "***");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Login failed. Try again." },
      { status: 500 }
    );
  }
}
