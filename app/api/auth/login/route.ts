import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ROUTE = 'api/auth/login'
const KC_BASE = process.env.KEYCLOAK_URL ?? 'https://auth.clarifer.com'
const KC_REALM = process.env.KEYCLOAK_REALM ?? 'clarifer'
const KC_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? 'clarifer-app'

export async function POST(request: Request) {
  let email: string | undefined
  let password: string | undefined

  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    email = typeof body?.email === 'string' ? body.email.trim() : undefined
    password = typeof body?.password === 'string' ? body.password : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required.' }, { status: 400 })
  }

  let tokenRes: Response
  try {
    tokenRes = await fetch(
      `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: KC_CLIENT_ID,
          username: email,
          password,
          scope: 'openid',
        }).toString(),
      }
    )
  } catch (err: unknown) {
    console.error(JSON.stringify({ route: ROUTE, event: 'keycloak_unreachable', error: String(err) }))
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }

  if (tokenRes.status === 401) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
  }

  if (!tokenRes.ok) {
    console.error(JSON.stringify({ route: ROUTE, event: 'keycloak_token_error', status: tokenRes.status }))
    return NextResponse.json({ error: 'Sign in failed. Please try again.' }, { status: 502 })
  }

  const data = await tokenRes.json() as { access_token: string; expires_in?: number }
  const accessToken = data.access_token

  const response = NextResponse.json({ message: 'Signed in successfully.' })
  response.cookies.set('clarifer_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 1800,
  })
  return response
}
