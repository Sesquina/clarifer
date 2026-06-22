/**
 * lib/auth/keycloak-client.ts
 * Keycloak API client. Used only in server-side API routes.
 * HIPAA: no PHI. Email addresses only.
 */
export const runtime = "nodejs";

const BASE = process.env.KEYCLOAK_URL ?? "https://auth.clarifer.com";
const REALM = process.env.KEYCLOAK_REALM ?? "clarifer";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? "clarifer-app";
const ADMIN_CLIENT_ID = "clarifer-admin";
const ADMIN_SECRET = process.env.KEYCLOAK_ADMIN_SECRET ?? "";

const TOKEN_URL = `${BASE}/realms/${REALM}/protocol/openid-connect/token`;
const ADMIN_USERS_URL = `${BASE}/admin/realms/${REALM}/users`;

export interface KeycloakTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function keycloakLogin(
  email: string,
  password: string
): Promise<KeycloakTokens | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: CLIENT_ID,
      username: email,
      password,
    }).toString(),
  });
  if (!res.ok) {
    console.log("[keycloak] login failed:", res.status);
    return null;
  }
  return res.json();
}

async function getAdminToken(): Promise<string | null> {
  if (!ADMIN_SECRET) {
    console.error("[keycloak] KEYCLOAK_ADMIN_SECRET not set");
    return null;
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: ADMIN_CLIENT_ID,
      client_secret: ADMIN_SECRET,
    }).toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

export async function keycloakCreateUser(
  email: string,
  password: string,
  firstName: string
): Promise<{ id: string } | { error: string }> {
  const adminToken = await getAdminToken();
  if (!adminToken) return { error: "Auth service unavailable. Try again shortly." };

  const res = await fetch(ADMIN_USERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      username: email,
      email,
      firstName,
      enabled: true,
      emailVerified: false,
      credentials: [{ type: "password", value: password, temporary: false }],
    }),
  });

  if (res.status === 409) return { error: "An account with that email already exists." };
  if (!res.ok) {
    console.log("[keycloak] create user failed:", res.status);
    return { error: "Could not create account. Try again shortly." };
  }

  const location = res.headers.get("Location") ?? "";
  const id = location.split("/").pop() ?? "";
  if (!id) return { error: "Account created but ID missing. Contact support." };
  console.log("[keycloak] user created:", id.slice(0, 8));
  return { id };
}
