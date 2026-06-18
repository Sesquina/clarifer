import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const runtime = 'nodejs'

const ROUTE = 'api/auth/signup'
const KC_BASE = process.env.KEYCLOAK_URL ?? 'https://auth.clarifer.com'
const KC_REALM = process.env.KEYCLOAK_REALM ?? 'clarifer'

async function getAdminToken(): Promise<string> {
  const res = await fetch(
    `${KC_BASE}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'ClarifKeycloak2026!Admin',
      }).toString(),
    }
  )
  if (!res.ok) throw new Error(`admin token ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

export async function POST(request: Request) {
  let email: string | undefined
  let password: string | undefined
  let name: string | undefined

  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    email = typeof body?.email === 'string' ? body.email.trim() : undefined
    password = typeof body?.password === 'string' ? body.password : undefined
    name = typeof body?.name === 'string' ? body.name.trim() : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'email, password, and name are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  let adminToken: string
  try {
    adminToken = await getAdminToken()
  } catch (err: unknown) {
    console.error(JSON.stringify({ route: ROUTE, event: 'admin_token_error', error: String(err) }))
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 })
  }

  const createRes = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: email,
        email,
        firstName: name,
        enabled: true,
        emailVerified: false,
        credentials: [{ type: 'password', value: password, temporary: false }],
      }),
    }
  )

  if (createRes.status === 409) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  if (createRes.status !== 201) {
    const detail = await createRes.text().catch(() => '')
    console.error(JSON.stringify({ route: ROUTE, event: 'keycloak_create_error', status: createRes.status, detail: detail.slice(0, 200) }))
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 502 })
  }

  const location = createRes.headers.get('Location') ?? ''
  const keycloakUserId = location.split('/').pop() ?? ''
  if (!keycloakUserId) {
    console.error(JSON.stringify({ route: ROUTE, event: 'missing_location_header' }))
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 502 })
  }

  const orgId = crypto.randomUUID()

  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'INSERT INTO organizations (id, name, created_at) VALUES ($1, $2, now())',
        [orgId, 'Personal']
      )
      await client.query(
        'INSERT INTO users (id, email, role, organization_id, created_at) VALUES ($1, $2, $3, $4, now())',
        [keycloakUserId, email, 'caregiver', orgId]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err: unknown) {
    console.error(JSON.stringify({ route: ROUTE, event: 'db_insert_error', error: String(err) }))
    return NextResponse.json({ error: 'Account created in auth system but profile setup failed. Contact support.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Account created.' }, { status: 201 })
}
