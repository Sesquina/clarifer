import { NextResponse } from 'next/server'
import { getUserFromCookies } from '@/lib/auth/get-user'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getUserFromCookies()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ id: user.id, email: user.email, role: user.role })
}
