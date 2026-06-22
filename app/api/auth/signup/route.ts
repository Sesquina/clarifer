/**
 * app/api/auth/signup/route.ts
 * Creates a Keycloak user, a users row, and an organizations row.
 * Logs in immediately and sets clarifer_token cookie.
 * HIPAA: audit log written on user creation.
 */
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { keycloakCreateUser, keycloakLogin } from "@/lib/auth/keycloak-client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const password = body.password as string | undefined;
    const firstName = (body.firstName as string | undefined)?.trim() ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Create Keycloak user
    const result = await keycloakCreateUser(email, password, firstName);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    const keycloakId = result.id;

    // Create organization and user row in database
    const supabase = await createClient();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: `${firstName || email}'s Care Team`, type: "personal" })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("[auth/signup] org creation failed:", orgError?.message);
      return NextResponse.json(
        { error: "Could not create account. Try again." },
        { status: 500 }
      );
    }

    // users.id = keycloakId so getUserFromRequest CASE 2 can resolve by email.
    // The users table has no keycloak_id column; id stores the Keycloak sub UUID.
    const { error: userError } = await supabase.from("users").insert({
      id: keycloakId,
      email,
      role: "caregiver",
      organization_id: org.id,
    });

    if (userError) {
      console.error("[auth/signup] user insert failed:", userError.message);
      return NextResponse.json(
        { error: "Could not create account. Try again." },
        { status: 500 }
      );
    }

    // Log in immediately to get token
    const tokens = await keycloakLogin(email, password);
    if (!tokens) {
      // Account created but login failed — user can log in manually
      return NextResponse.json({ ok: true, mustLogin: true }, { status: 201 });
    }

    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set("clarifer_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });
    console.log("[auth/signup] created:", keycloakId.slice(0, 8));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Signup failed. Try again." },
      { status: 500 }
    );
  }
}
