import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface ClarifUser {
  id: string
  email: string | null
  role: string
}

const KC_ROLE_EXCLUDES = new Set(['offline_access', 'uma_authorization'])

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS(): ReturnType<typeof createRemoteJWKSet> | null {
  if (jwks) return jwks
  const base = process.env.KEYCLOAK_URL
  const realm = process.env.KEYCLOAK_REALM
  if (!base || !realm) return null
  try {
    jwks = createRemoteJWKSet(
      new URL(`${base}/realms/${realm}/protocol/openid-connect/certs`)
    )
  } catch {
    return null
  }
  return jwks
}

export async function verifyToken(token: string): Promise<ClarifUser | null> {
  const jwksSet = getJWKS()
  if (!jwksSet) return null
  const base = process.env.KEYCLOAK_URL
  const realm = process.env.KEYCLOAK_REALM
  if (!base || !realm) return null
  try {
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
