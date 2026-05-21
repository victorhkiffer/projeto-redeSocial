import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

const patchSchema = z
  .object({
    name: z.string().min(2).optional(),
    legalName: z.string().min(2).optional().nullable(),
    cnpj: z.string().min(8).optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(6).optional().nullable(),
    description: z.string().min(1).optional().nullable(),
    websiteUrl: z.string().min(4).optional().nullable(),
    industry: z.string().min(2).optional().nullable(),
    logoUrl: z.string().min(4).optional().nullable()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update' })

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

export default async function companiesRoutes(app: FastifyInstance) {
  app.get('/companies/search', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const query = z
      .object({
        q: z.string().min(1).max(100),
        limit: z.coerce.number().int().min(1).max(50).default(20)
      })
      .parse(req.query ?? {})

    const res = await pool.query<{
      id: string
      name: string
      industry: string | null
      logo_url: string | null
      followed_by_me: boolean
    }>(
      `
      select
        c.id,
        c.name,
        c.industry,
        c.logo_url,
        exists(
          select 1 from follows f
          where f.follower_company_id = $2 and f.followed_company_id = c.id
        ) as followed_by_me
      from companies c
      where c.name ilike ('%' || $1 || '%')
      order by c.name asc
      limit $3
      `,
      [query.q, user.companyId, query.limit]
    )

    return {
      items: res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        industry: r.industry,
        logoUrl: r.logo_url,
        followedByMe: r.followed_by_me
      }))
    }
  })

  app.get('/companies/:id', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const companyId = String(req.params.id)
    const res = await pool.query<{
      id: string
      name: string
      legal_name: string | null
      cnpj: string | null
      email: string | null
      phone: string | null
      description: string | null
      website_url: string | null
      industry: string | null
      logo_url: string | null
      created_at: string
      updated_at: string
    }>(
      `
      select id, name, legal_name, cnpj, email, phone, description, website_url, industry, logo_url, created_at, updated_at
      from companies
      where id = $1
      `,
      [companyId]
    )
    const row = res.rows[0]
    if (!row) return reply.code(404).send({ message: 'Company not found' })
    return {
      id: row.id,
      name: row.name,
      legalName: row.legal_name,
      cnpj: row.cnpj,
      email: row.email,
      phone: row.phone,
      description: row.description,
      websiteUrl: row.website_url,
      industry: row.industry,
      logoUrl: row.logo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  })

  app.patch('/companies/:id', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    ensureAdminOrOwner(user.role)

    const companyId = String(req.params.id)
    ensureSameCompany(companyId, user.companyId)

    const body = patchSchema.parse(req.body)

    const updates: string[] = []
    const values: any[] = []
    let i = 1

    function set(column: string, value: any) {
      updates.push(`${column} = $${i}`)
      values.push(value)
      i += 1
    }

    if ('name' in body) set('name', body.name)
    if ('legalName' in body) set('legal_name', body.legalName ?? null)
    if ('cnpj' in body) set('cnpj', body.cnpj ?? null)
    if ('email' in body) set('email', body.email ?? null)
    if ('phone' in body) set('phone', body.phone ?? null)
    if ('description' in body) set('description', body.description ?? null)
    if ('websiteUrl' in body) set('website_url', body.websiteUrl ?? null)
    if ('industry' in body) set('industry', body.industry ?? null)
    if ('logoUrl' in body) set('logo_url', body.logoUrl ?? null)

    updates.push(`updated_at = now()`)
    values.push(companyId)

    const sql = `
      update companies
      set ${updates.join(', ')}
      where id = $${i}
      returning id
    `

    const res = await pool.query<{ id: string }>(sql, values)
    if (!res.rows[0]) return reply.code(404).send({ message: 'Company not found' })
    return { ok: true }
  })

  app.post('/companies/:id/logo', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    ensureAdminOrOwner(user.role)

    const companyId = String(req.params.id)
    ensureSameCompany(companyId, user.companyId)

    const body = z.object({ logoUrl: z.string().min(4) }).parse(req.body)
    await pool.query('update companies set logo_url = $1, updated_at = now() where id = $2', [body.logoUrl, companyId])
    return { ok: true }
  })
}
