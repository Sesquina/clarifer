import { cookies } from 'next/headers'
import { verifyToken, type ClarifUser } from './verify-token'

function tokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/(?:^|;\s*)clarifer_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function getUserFromRequest(request: Request): Promise<ClarifUser | null> {
  const token = tokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

export async function getUserFromCookies(): Promise<ClarifUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('clarifer_token')?.value
  if (!token) return null
  return verifyToken(token)
}
