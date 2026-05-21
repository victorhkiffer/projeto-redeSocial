import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER')
})

function ensureSameCompany(targetCompanyId: string, authCompanyId: string) {
  if (targetCompanyId !== authCompanyId) {
    const err = new Error('Forbidden') as Error & { statusCode?: number }
    err.statusCode = 403
    throw err
  }
}

function ensureAdminOrOwner(role: string) {
  if (role !== 'OWNER' && role !== 'ADMIN') {
    const err = new Error('Forbidden') as Error & { statusCode?: number }
    err.statusCode = 403
    throw err
  }
}

export default async function representativesRoutes(app: FastifyInstance) {
  app.get('/companies/:id/representatives', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const companyId = String(req.params.id)
    ensureSameCompany(companyId, user.companyId)

    const res = await pool.query<{
      id: string
      name: string
      email: string
      role: string
      status: string
      created_at: string
    }>(
      `
      select id, name, email, role, status, created_at
      from representatives
      where company_id = $1
      order by created_at desc
      `,
      [companyId]
    )

    return { items: res.rows }
  })

  app.post('/companies/:id/representatives', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    ensureAdminOrOwner(user.role)

    const companyId = String(req.params.id)
    ensureSameCompany(companyId, user.companyId)

    const body = createSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(body.password, 12)

    const res = await pool.query<{ id: string }>(
      `
      insert into representatives (company_id, name, email, password_hash, role, status)
      values ($1, $2, $3, $4, $5, 'PENDING')
      returning id
      `,
      [companyId, body.name, body.email.toLowerCase(), passwordHash, body.role]
    )

    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.post('/representatives/:id/approve', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    ensureAdminOrOwner(user.role)

    const repId = String(req.params.id)
    const repRes = await pool.query<{ company_id: string }>('select company_id from representatives where id = $1', [
      repId
    ])
    const rep = repRes.rows[0]
    if (!rep) return { ok: false }
    ensureSameCompany(rep.company_id, user.companyId)

    await pool.query("update representatives set status = 'ACTIVE', updated_at = now() where id = $1", [repId])
    return { ok: true }
  })

  app.post('/representatives/:id/reject', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    ensureAdminOrOwner(user.role)

    const repId = String(req.params.id)
    const repRes = await pool.query<{ company_id: string }>('select company_id from representatives where id = $1', [
      repId
    ])
    const rep = repRes.rows[0]
    if (!rep) return { ok: false }
    ensureSameCompany(rep.company_id, user.companyId)

    await pool.query("update representatives set status = 'REJECTED', updated_at = now() where id = $1", [repId])
    return { ok: true }
  })

  app.post('/representatives/:id/disable', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    ensureAdminOrOwner(user.role)

    const repId = String(req.params.id)
    if (repId === user.representativeId) return { ok: false, message: 'Cannot disable yourself' }

    const repRes = await pool.query<{ company_id: string }>('select company_id from representatives where id = $1', [
      repId
    ])
    const rep = repRes.rows[0]
    if (!rep) return { ok: false }
    ensureSameCompany(rep.company_id, user.companyId)

    await pool.query("update representatives set status = 'DISABLED', updated_at = now() where id = $1", [repId])
    return { ok: true }
  })
}

