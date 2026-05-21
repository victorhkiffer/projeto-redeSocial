import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20)
})

export default async function followsRoutes(app: FastifyInstance) {
  app.post('/companies/:id/follow', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const followedCompanyId = String(req.params.id)
    if (followedCompanyId === user.companyId) return { ok: false, message: 'Cannot follow yourself' }

    await pool.query(
      `
      insert into follows (follower_company_id, followed_company_id)
      values ($1, $2)
      on conflict do nothing
      `,
      [user.companyId, followedCompanyId]
    )
    return { ok: true }
  })

  app.post('/companies/:id/unfollow', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const followedCompanyId = String(req.params.id)
    await pool.query('delete from follows where follower_company_id = $1 and followed_company_id = $2', [
      user.companyId,
      followedCompanyId
    ])
    return { ok: true }
  })

  app.get('/companies/:id/followers', { preHandler: requireAuth(app) }, async (req: any) => {
    const companyId = String(req.params.id)
    const query = listQuerySchema.parse(req.query ?? {})
    const res = await pool.query<{ id: string; name: string; created_at: string }>(
      `
      select c.id, c.name, f.created_at
      from follows f
      join companies c on c.id = f.follower_company_id
      where f.followed_company_id = $1
      order by f.created_at desc
      limit $2
      `,
      [companyId, query.limit]
    )
    return { items: res.rows.map((r) => ({ id: r.id, name: r.name, followedAt: r.created_at })) }
  })

  app.get('/companies/:id/following', { preHandler: requireAuth(app) }, async (req: any) => {
    const companyId = String(req.params.id)
    const query = listQuerySchema.parse(req.query ?? {})
    const res = await pool.query<{ id: string; name: string; created_at: string }>(
      `
      select c.id, c.name, f.created_at
      from follows f
      join companies c on c.id = f.followed_company_id
      where f.follower_company_id = $1
      order by f.created_at desc
      limit $2
      `,
      [companyId, query.limit]
    )
    return { items: res.rows.map((r) => ({ id: r.id, name: r.name, followedAt: r.created_at })) }
  })
}

