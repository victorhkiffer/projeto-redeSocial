import type { FastifyInstance } from 'fastify'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

export default async function meRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!

    const res = await pool.query<{
      representative_id: string
      representative_name: string
      representative_email: string
      representative_role: string
      representative_status: string
      company_id: string
      company_name: string
    }>(
      `
      select
        r.id as representative_id,
        r.name as representative_name,
        r.email as representative_email,
        r.role as representative_role,
        r.status as representative_status,
        c.id as company_id,
        c.name as company_name
      from representatives r
      join companies c on c.id = r.company_id
      where r.id = $1
      `,
      [user.representativeId]
    )

    const row = res.rows[0]
    return {
      representative: {
        id: row.representative_id,
        name: row.representative_name,
        email: row.representative_email,
        role: row.representative_role,
        status: row.representative_status
      },
      company: {
        id: row.company_id,
        name: row.company_name
      }
    }
  })
}

