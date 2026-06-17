import { createLocalJWKSet, jwtVerify } from 'jose'

export interface ClarifUser {
  id: string
  email: string | null
  role: string
}

const KC_ROLE_EXCLUDES = new Set(['offline_access', 'uma_authorization'])

let _jwksCache: { keys: unknown[]; fetchedAt: number } | null = null
const JWKS_TTL = 60 * 60 * 1000 // 1 hour

async function getCachedJwks(): Promise<unknown[]> {
  if (_jwksCache && Date.now() - _jwksCache.fetchedAt < JWKS_TTL) {
    return _jwksCache.keys
  }
  const base = process.env.KEYCLOAK_URL
  const realm = process.env.KEYCLOAK_REALM
  if (!base || !realm) throw new Error('KEYCLOAK_URL or KEYCLOAK_REALM not set')
  const url = `${base}/realms/${realm}/protocol/openid-connect/certs`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`)
  const data = await res.json() as { keys: unknown[] }
  _jwksCache = { keys: data.keys, fetchedAt: Date.now() }
  return data.keys
}

export async function verifyToken(token: string): Promise<ClarifUser | null> {
  const base = process.env.KEYCLOAK_URL
  const realm = process.env.KEYCLOAK_REALM
  if (!base || !realm) return null
  try {
    const keys = await getCachedJwks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jwksSet = createLocalJWKSet({ keys } as any)
    const { payload } = await jwtVerify(token, jwksSet, {
      issuer: `${base}/realms/${realm}`,
    })
    const realmAccess = payload.realm_access as { roles?: string[] } | undefined
    const appRoles = (realmAccess?.roles ?? []).filter(
      (r) => !KC_ROLE_EXCLUDES.has(r) && !r.startsWith('default-roles-')
    )
    return {
      id: payload.sub ?? '',
      email: (payload.email as string | undefined) ?? null,
      role: appRoles[0] ?? 'caregiver',
    }
  } catch {
    return null
  }
}
