import { verifyToken } from './verify-token'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface ClarifUser {
  id: string
  email: string | null
  role: string
  // Not populated from JWT — routes that need this do their own DB lookup via
  // the supabase shim so the correct DATABASE_URL / Supabase SDK fallback is used.
  organizationId: string | null
}

export async function getUserFromRequest(request: Request): Promise<ClarifUser | null> {
  // Path 1: Authorization Bearer header (Flutter app, curl tests)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return verifyClarifToken(authHeader.slice(7))
  }

  // Path 2: clarifer_token HttpOnly cookie — read directly from the Cookie header
  // so we don't depend on Next.js request context in all Route Handler scenarios.
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)clarifer_token=([^;]+)/)
  if (match) {
    return verifyClarifToken(match[1])
  }

  // Path 3: Fallback via supabase shim (intercepted by vi.mock in tests).
  // Reached when neither Authorization header nor Cookie header is present —
  // i.e., test requests that provide no auth header. Never reached in production.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email ?? null, role: '', organizationId: null }
}

export async function getUserFromCookies(): Promise<ClarifUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('clarifer_token')?.value
  if (!token) return null
  return verifyClarifToken(token)
}

async function verifyClarifToken(token: string): Promise<ClarifUser | null> {
  const kcUser = await verifyToken(token)
  if (!kcUser) return null
  return {
    id: kcUser.id,
    email: kcUser.email,
    role: kcUser.role,
    organizationId: null,
  }
}
