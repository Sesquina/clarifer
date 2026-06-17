import { cookies } from 'next/headers'
import { verifyToken, type ClarifUser } from './verify-token'
import { createClient } from '@/lib/supabase/server'

export async function getUserFromRequest(request: Request): Promise<ClarifUser | null> {
  // Authorization: Bearer header — used by API clients and curl tests
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return verifyToken(auth.slice(7))
  }
  // Cookie path: delegate through the supabase shim, which reads clarifer_token
  // and is interceptable in unit tests via vi.mock("@/lib/supabase/server")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email ?? null, role: '' }
}

export async function getUserFromCookies(): Promise<ClarifUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('clarifer_token')?.value
  if (!token) return null
  return verifyToken(token)
}
