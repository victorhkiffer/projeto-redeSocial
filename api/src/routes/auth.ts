import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from '../db'
import { newOpaqueToken, sha256 } from '../auth/tokens'

const registerSchema = z.object({
  companyName: z.string().min(2),
  representativeName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
})

function nowPlusDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)

    const passwordHash = await bcrypt.hash(body.password, 12)

    const client = await pool.connect()
    try {
      await client.query('begin')

      const companyRes = await client.query<{ id: string }>(
        'insert into companies (name) values ($1) returning id',
        [body.companyName]
      )

      const companyId = companyRes.rows[0]?.id
      if (!companyId) throw new Error('Failed to create company')

      const representativeRes = await client.query<{ id: string }>(
        `
        insert into representatives (company_id, name, email, password_hash, role, status)
        values ($1, $2, $3, $4, 'OWNER', 'ACTIVE')
        returning id
        `,
        [companyId, body.representativeName, body.email.toLowerCase(), passwordHash]
      )
      const representativeId = representativeRes.rows[0]?.id
      if (!representativeId) throw new Error('Failed to create representative')

      await client.query('commit')

      return reply.code(201).send({
        companyId,
        representativeId
      })
    } catch (err) {
      await client.query('rollback')
      throw err
    } finally {
      client.release()
    }
  })

  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)

    const repRes = await pool.query<{
      id: string
      company_id: string
      password_hash: string
      status: string
      role: string
      email: string
    }>(
      'select id, company_id, password_hash, status, role, email from representatives where email = $1',
      [body.email.toLowerCase()]
    )
    const rep = repRes.rows[0]
    if (!rep) return reply.code(401).send({ message: 'Invalid credentials' })
    if (rep.status !== 'ACTIVE') return reply.code(403).send({ message: 'Representative not active' })

    const ok = await bcrypt.compare(body.password, rep.password_hash)
    if (!ok) return reply.code(401).send({ message: 'Invalid credentials' })

    const accessToken = await reply.jwtSign(
      { sub: rep.id, companyId: rep.company_id, role: rep.role, email: rep.email },
      { expiresIn: '15m' }
    )

    const refreshToken = newOpaqueToken()
    const refreshHash = sha256(refreshToken)
    const refreshExpiresAt = nowPlusDays(30)

    await pool.query(
      `
      insert into auth_sessions (representative_id, refresh_token_hash, expires_at)
      values ($1, $2, $3)
      `,
      [rep.id, refreshHash, refreshExpiresAt]
    )

    return reply.send({
      accessToken,
      refreshToken
    })
  })

  app.post('/auth/refresh', async (req, reply) => {
    const body = refreshSchema.parse(req.body)
    const tokenHash = sha256(body.refreshToken)

    const sessionRes = await pool.query<{
      id: string
      representative_id: string
      expires_at: string
      revoked_at: string | null
    }>('select id, representative_id, expires_at, revoked_at from auth_sessions where refresh_token_hash = $1', [
      tokenHash
    ])
    const session = sessionRes.rows[0]
    if (!session) return reply.code(401).send({ message: 'Invalid refresh token' })
    if (session.revoked_at) return reply.code(401).send({ message: 'Invalid refresh token' })
    if (new Date(session.expires_at).getTime() < Date.now()) return reply.code(401).send({ message: 'Expired refresh token' })

    const repRes = await pool.query<{ id: string; company_id: string; role: string; status: string; email: string }>(
      'select id, company_id, role, status, email from representatives where id = $1',
      [session.representative_id]
    )
    const rep = repRes.rows[0]
    if (!rep || rep.status !== 'ACTIVE') return reply.code(403).send({ message: 'Representative not active' })

    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query('update auth_sessions set revoked_at = now() where id = $1', [session.id])

      const newRefreshToken = newOpaqueToken()
      const newRefreshHash = sha256(newRefreshToken)
      const refreshExpiresAt = nowPlusDays(30)
      await client.query(
        `
        insert into auth_sessions (representative_id, refresh_token_hash, expires_at)
        values ($1, $2, $3)
        `,
        [rep.id, newRefreshHash, refreshExpiresAt]
      )

      await client.query('commit')

      const accessToken = await reply.jwtSign(
        { sub: rep.id, companyId: rep.company_id, role: rep.role, email: rep.email },
        { expiresIn: '15m' }
      )

      return reply.send({ accessToken, refreshToken: newRefreshToken })
    } catch (err) {
      await client.query('rollback')
      throw err
    } finally {
      client.release()
    }
  })

  app.post('/auth/logout', async (req, reply) => {
    const body = refreshSchema.parse(req.body)
    const tokenHash = sha256(body.refreshToken)

    await pool.query('update auth_sessions set revoked_at = now() where refresh_token_hash = $1 and revoked_at is null', [
      tokenHash
    ])
    return reply.send({ ok: true })
  })
}

