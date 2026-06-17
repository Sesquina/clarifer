/**
 * lib/supabase/server.ts
 * Compatibility shim: exposes the same createClient() surface as before
 * but routes auth through Keycloak JWT and queries through pg pool.
 * Storage operations still use Supabase Storage (file migration is out of scope).
 *
 * DECISION REQUIRED: exchangeCodeForSession and resetPasswordForEmail are
 * Supabase-specific flows. With Keycloak these are handled differently
 * (PKCE callback via Keycloak adapter; password reset via Keycloak admin API).
 * Both are stubbed here -- implement before removing Supabase from OAuth flows.
 */
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/auth/verify-token'
import type { Pool } from 'pg'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  error: Error | null
  count?: number
}

export interface ClarifSupabase {
  auth: {
    getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: null }>
    signOut(): Promise<{ error: null }>
    resetPasswordForEmail(
      email: string,
      opts?: { redirectTo?: string }
    ): Promise<{ error: null }>
    exchangeCodeForSession(
      code: string
    ): Promise<{ data: { user: { id: string; email?: string } | null } | null; error: Error | null }>
  }
  from(table: string): QueryBuilderLike
  storage: SupabaseStorageLike
}

export interface QueryBuilderLike {
  select(columns?: string, opts?: { count?: string; head?: boolean }): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  in(col: string, vals: any[]): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eq(col: string, val: any): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  neq(col: string, val: any): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gte(col: string, val: any): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lte(col: string, val: any): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lt(col: string, val: any): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gt(col: string, val: any): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  is(col: string, val: any): QueryBuilderLike
  not(col: string, op: string, val: any): QueryBuilderLike
  order(col: string, opts?: { ascending?: boolean }): QueryBuilderLike
  limit(n: number): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insert(data: Record<string, any>): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(data: Record<string, any>): QueryBuilderLike
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upsert(data: Record<string, any>, opts?: { onConflict?: string }): QueryBuilderLike
  delete(): QueryBuilderLike
  single(): Promise<QueryResult>
  maybeSingle(): Promise<QueryResult>
  then<T>(
    resolve: (v: QueryResult) => T,
    reject?: (r: any) => T
  ): Promise<T>
}

interface SupabaseStorageLike {
  from(bucket: string): {
    upload(path: string, file: unknown, opts?: unknown): Promise<QueryResult>
    createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: Error | null }>
    remove(paths: string[]): Promise<QueryResult>
  }
}

// ---------------------------------------------------------------------------
// Query Builder (pg-backed)
// ---------------------------------------------------------------------------

type WhereClause = [string, string, unknown]
type OrderClause = [string, boolean]

class QueryBuilder implements QueryBuilderLike {
  private _pool: Pool
  private _table: string
  private _action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private _columns: string = '*'
  private _wheres: WhereClause[] = []
  private _inClauses: Array<[string, unknown[]]> = []
  private _orders: OrderClause[] = []
  private _limitN: number | null = null
  private _payload: Record<string, unknown> | null = null
  private _returning: boolean = false
  private _onConflict: string | null = null
  private _countMode: boolean = false
  private _headMode: boolean = false

  constructor(dbPool: Pool, table: string) {
    this._pool = dbPool
    this._table = table
  }

  select(columns: string = '*', opts?: { count?: string; head?: boolean }): this {
    if (this._action === 'insert' || this._action === 'upsert') {
      this._returning = true
    } else {
      this._action = 'select'
    }
    this._columns = columns
    if (opts?.count) this._countMode = true
    if (opts?.head) this._headMode = true
    return this
  }

  in(col: string, vals: unknown[]): this {
    this._inClauses.push([col, vals])
    return this
  }

  eq(col: string, val: unknown): this {
    this._wheres.push([col, '=', val])
    return this
  }

  neq(col: string, val: unknown): this {
    this._wheres.push([col, '<>', val])
    return this
  }

  gte(col: string, val: unknown): this {
    this._wheres.push([col, '>=', val])
    return this
  }

  lte(col: string, val: unknown): this {
    this._wheres.push([col, '<=', val])
    return this
  }

  lt(col: string, val: unknown): this {
    this._wheres.push([col, '<', val])
    return this
  }

  gt(col: string, val: unknown): this {
    this._wheres.push([col, '>', val])
    return this
  }

  is(col: string, val: unknown): this {
    this._wheres.push([col, 'IS', val])
    return this
  }

  not(col: string, _op: string, val: unknown): this {
    this._wheres.push([col, '!=', val])
    return this
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this._orders.push([col, opts?.ascending ?? true])
    return this
  }

  limit(n: number): this {
    this._limitN = n
    return this
  }

  insert(data: Record<string, unknown>): this {
    this._action = 'insert'
    this._payload = data
    return this
  }

  update(data: Record<string, unknown>): this {
    this._action = 'update'
    this._payload = data
    return this
  }

  upsert(data: Record<string, unknown>, opts?: { onConflict?: string }): this {
    this._action = 'upsert'
    this._payload = data
    this._onConflict = opts?.onConflict ?? null
    return this
  }

  delete(): this {
    this._action = 'delete'
    return this
  }

  private async _exec(): Promise<QueryResult> {
    const params: unknown[] = []
    const p = (val: unknown): string => {
      params.push(val)
      return `$${params.length}`
    }

    const buildWhere = (wheres: WhereClause[]): string => {
      const clauses: string[] = []

      for (const [col, op, val] of wheres) {
        if (op === 'IS' && val === null) {
          clauses.push(`${col} IS NULL`)
        } else if (op === 'IS') {
          clauses.push(`${col} IS NOT NULL`)
        } else {
          clauses.push(`${col} ${op} ${p(val)}`)
        }
      }

      for (const [col, vals] of this._inClauses) {
        if (!vals.length) {
          clauses.push('FALSE')
        } else {
          const placeholders = vals.map((v) => p(v)).join(', ')
          clauses.push(`${col} IN (${placeholders})`)
        }
      }

      return clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''
    }

    const buildOrder = (): string => {
      if (!this._orders.length) return ''
      return (
        'ORDER BY ' +
        this._orders.map(([col, asc]) => `${col} ${asc ? 'ASC' : 'DESC'}`).join(', ')
      )
    }

    try {
      if (this._action === 'select') {
        if (this._countMode) {
          const countParts = [
            `SELECT COUNT(*) FROM ${this._table}`,
            buildWhere(this._wheres),
          ].filter(Boolean)
          const result = await this._pool.query(countParts.join(' '), params)
          const count = parseInt(result.rows[0]?.count ?? '0', 10)
          return { data: null, error: null, count }
        }

        const parts = [
          `SELECT ${this._columns} FROM ${this._table}`,
          buildWhere(this._wheres),
          buildOrder(),
          this._limitN ? `LIMIT ${this._limitN}` : '',
        ].filter(Boolean)
        const result = await this._pool.query(parts.join(' '), params)
        return { data: result.rows, error: null }
      }

      if (this._action === 'insert') {
        const data = this._payload!
        const keys = Object.keys(data)
        const vals = Object.values(data)
        const placeholders = vals.map((v) => p(v))
        const returning = this._returning ? ' RETURNING *' : ''
        const sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})${returning}`
        const result = await this._pool.query(sql, params)
        return {
          data: this._returning ? (result.rows[0] ?? null) : null,
          error: null,
        }
      }

      if (this._action === 'update') {
        const data = this._payload!
        const keys = Object.keys(data)
        const setClause = keys
          .map((k) => `${k} = ${p((data as Record<string, unknown>)[k])}`)
          .join(', ')
        const parts = [
          `UPDATE ${this._table} SET ${setClause}`,
          buildWhere(this._wheres),
        ].filter(Boolean)
        const result = await this._pool.query(parts.join(' '), params)
        return { data: result.rows, error: null }
      }

      if (this._action === 'delete') {
        const parts = [
          `DELETE FROM ${this._table}`,
          buildWhere(this._wheres),
        ].filter(Boolean)
        await this._pool.query(parts.join(' '), params)
        return { data: null, error: null }
      }

      if (this._action === 'upsert') {
        const data = this._payload!
        const keys = Object.keys(data)
        const vals = Object.values(data)
        const placeholders = vals.map((v) => p(v))
        const conflictCol = this._onConflict ?? 'id'
        const updateCols = keys.filter((k) => k !== conflictCol)
        const updateSet = updateCols.map((k) => `${k} = EXCLUDED.${k}`).join(', ')
        const returning = this._returning ? ' RETURNING *' : ''
        const sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${conflictCol}) DO ${updateCols.length ? `UPDATE SET ${updateSet}` : 'NOTHING'}${returning}`
        const result = await this._pool.query(sql, params)
        return {
          data: this._returning ? (result.rows[0] ?? null) : null,
          error: null,
        }
      }

      return { data: null, error: new Error('Unknown query action') }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  async single(): Promise<QueryResult> {
    const { data, error } = await this._exec()
    if (error) return { data: null, error }
    if (Array.isArray(data)) return { data: data[0] ?? null, error: null }
    return { data, error: null }
  }

  async maybeSingle(): Promise<QueryResult> {
    return this.single()
  }

  then<T>(
    resolve: (v: QueryResult) => T,
    reject?: (r: unknown) => T
  ): Promise<T> {
    return this._exec().then(resolve, reject)
  }
}

// ---------------------------------------------------------------------------
// Supabase storage proxy (files remain in Supabase Storage for now)
// ---------------------------------------------------------------------------

function makeStorage(): SupabaseStorageLike {
  const storageClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  ).storage

  return {
    from(bucket: string) {
      const bkt = storageClient.from(bucket)
      return {
        async upload(path: string, file: unknown, opts?: unknown) {
          const { error } = await bkt.upload(
            path,
            file as Parameters<typeof bkt.upload>[1],
            opts as Parameters<typeof bkt.upload>[2]
          )
          return { data: null, error: error ?? null }
        },
        async createSignedUrl(path: string, expiresIn: number) {
          const { data, error } = await bkt.createSignedUrl(path, expiresIn)
          return { data: data ?? null, error: error ?? null }
        },
        async remove(paths: string[]) {
          const { error } = await bkt.remove(paths)
          return { data: null, error: error ?? null }
        },
      }
    },
  }
}

// ---------------------------------------------------------------------------
// createClient — main export
// ---------------------------------------------------------------------------

export async function createClient(): Promise<ClarifSupabase> {
  const cookieStore = await cookies()
  const token = cookieStore.get('clarifer_token')?.value ?? null

  const storage = makeStorage()

  return {
    auth: {
      async getUser() {
        if (!token) return { data: { user: null }, error: null }
        const user = await verifyToken(token)
        if (!user) return { data: { user: null }, error: null }
        return { data: { user: { id: user.id, email: user.email } }, error: null }
      },

      async signOut() {
        return { error: null }
      },

      async resetPasswordForEmail(_email: string, _opts?: { redirectTo?: string }) {
        // DECISION REQUIRED: password reset via Keycloak requires admin API call
        // or a Keycloak-native reset flow. Stubbed for I4.
        return { error: null }
      },

      async exchangeCodeForSession(_code: string) {
        // DECISION REQUIRED: Keycloak OAuth callback uses a different flow (PKCE
        // with the Keycloak JS adapter). Stubbed for I4 -- implement in I5 when
        // replacing the Supabase OAuth login page with Keycloak login redirect.
        return {
          data: null,
          error: new Error('exchangeCodeForSession not supported with Keycloak -- use PKCE flow'),
        }
      },
    },

    from(table: string) {
      return new QueryBuilder(pool, table)
    },

    storage,
  }
}
