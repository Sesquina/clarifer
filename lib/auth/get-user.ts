import pool from '@/lib/db'
import { verifyToken } from './verify-token'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface ClarifUser {
  id: string
  email: string | null
  role: string
  organizationId: string | null
}

export async function getUserFromRequest(request: Request): Promise<ClarifUser | null> {
  // Path 1: Authorization Bearer header (Flutter app, curl tests)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return getUserFromToken(authHeader.slice(7))
  }

  // Path 2: clarifer_token HttpOnly cookie -- read directly from the request Cookie header.
  // This avoids the Next.js cookies() async context and works reliably in all
  // Route Handler environments.
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)clarifer_token=([^;]+)/)
  if (match) {
    return getUserFromToken(match[1])
  }

  // Path 3: Fallback via supabase shim (intercepted by vi.mock in tests).
  // Reached when neither Authorization header nor Cookie header is present.
  // We deliberately use the shim here (not pool.query) so that the 41 test files
  // that mock @/lib/supabase/server keep working without changes.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: row } = await supabase.from('users').select('role, organization_id').eq('id', user.id).single()
  return {
    id: user.id,
    email: user.email ?? null,
    role: row?.role ?? '',
    organizationId: row?.organization_id ?? null,
  }
}

export async function getUserFromCookies(): Promise<ClarifUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('clarifer_token')?.value
  if (!token) return null
  return getUserFromToken(token)
}

async function getUserFromToken(token: string): Promise<ClarifUser | null> {
  const keycloakUser = await verifyToken(token)
  if (!keycloakUser) return null
  return getUserFromId(keycloakUser.id, keycloakUser.email)
}

async function getUserFromId(id: string, email: string | null): Promise<ClarifUser | null> {
  try {
    const result = await pool.query<{
      id: string
      email: string
      role: string
      organization_id: string | null
    }>(
      'SELECT id, email, role, organization_id FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      // Authenticated with Keycloak but not in DB yet (pre-onboarding first login)
      return { id, email, role: 'caregiver', organizationId: null }
    }

    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email ?? email,
      role: row.role,
      organizationId: row.organization_id,
    }
  } catch (err) {
    console.error(JSON.stringify({
      route: 'lib/auth/get-user',
      error: String(err),
      step: 'db_lookup',
    }))
    return null
  }
}
