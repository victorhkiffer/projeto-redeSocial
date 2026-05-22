import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

const createCategorySchema = z.object({ name: z.string().min(2).max(100) })

const createOfferingSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(2).max(120),
  description: z.string().max(5000).optional().nullable(),
  basePriceCents: z.number().int().positive().optional().nullable()
})

const listOfferingsQuery = z.object({
  companyId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
})

const createRequestSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(5000)
})

const listRequestsQuery = z.object({
  scope: z.enum(['mine', 'all']).default('mine'),
  limit: z.coerce.number().int().min(1).max(50).default(20)
})

const createProposalSchema = z.object({
  priceCents: z.number().int().positive().optional().nullable(),
  message: z.string().max(5000).optional().nullable()
})

export default async function servicesRoutes(app: FastifyInstance) {
  app.get('/service-categories', { preHandler: requireAuth(app) }, async () => {
    const res = await pool.query<{ id: string; name: string }>('select id, name from service_categories order by name asc')
    return { items: res.rows }
  })

  app.post('/service-categories', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const body = createCategorySchema.parse(req.body)
    const res = await pool.query<{ id: string }>(
      `
      insert into service_categories (name)
      values ($1)
      on conflict (name) do update set name = excluded.name
      returning id
      `,
      [body.name.trim()]
    )
    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.post('/service-offerings', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const body = createOfferingSchema.parse(req.body)
    const res = await pool.query<{ id: string }>(
      `
      insert into service_offerings (company_id, category_id, title, description, base_price_cents)
      values ($1, $2, $3, $4, $5)
      returning id
      `,
      [user.companyId, body.categoryId, body.title, body.description ?? null, body.basePriceCents ?? null]
    )
    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.get('/service-offerings', { preHandler: requireAuth(app) }, async (req: any) => {
    const q = listOfferingsQuery.parse(req.query ?? {})
    const filters: string[] = []
    const values: any[] = []
    let i = 1

    if (q.companyId) {
      filters.push(`so.company_id = $${i++}`)
      values.push(q.companyId)
    }
    if (q.categoryId) {
      filters.push(`so.category_id = $${i++}`)
      values.push(q.categoryId)
    }
    values.push(q.limit)
    const where = filters.length ? `where ${filters.join(' and ')}` : ''

    const res = await pool.query<{
      id: string
      company_id: string
      company_name: string
      category_id: string
      category_name: string
      title: string
      description: string | null
      base_price_cents: number | null
      created_at: string
    }>(
      `
      select
        so.id,
        so.company_id,
        c.name as company_name,
        so.category_id,
        sc.name as category_name,
        so.title,
        so.description,
        so.base_price_cents,
        so.created_at
      from service_offerings so
      join companies c on c.id = so.company_id
      join service_categories sc on sc.id = so.category_id
      ${where}
      order by so.created_at desc
      limit $${i}
      `,
      values
    )

    return {
      items: res.rows.map((r) => ({
        id: r.id,
        company: { id: r.company_id, name: r.company_name },
        category: { id: r.category_id, name: r.category_name },
        title: r.title,
        description: r.description,
        basePriceCents: r.base_price_cents,
        createdAt: r.created_at
      }))
    }
  })

  app.post('/service-requests', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const body = createRequestSchema.parse(req.body)
    const res = await pool.query<{ id: string }>(
      `
      insert into service_requests (requester_company_id, category_id, title, description, status)
      values ($1, $2, $3, $4, 'OPEN')
      returning id
      `,
      [user.companyId, body.categoryId, body.title, body.description]
    )
    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.get('/service-requests', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const q = listRequestsQuery.parse(req.query ?? {})
    const where =
      q.scope === 'mine' ? 'where sr.requester_company_id = $1' : 'where sr.requester_company_id <> $1'

    const res = await pool.query<{
      id: string
      requester_company_id: string
      requester_company_name: string
      category_id: string
      category_name: string
      title: string
      description: string
      status: string
      created_at: string
    }>(
      `
      select
        sr.id,
        sr.requester_company_id,
        c.name as requester_company_name,
        sr.category_id,
        sc.name as category_name,
        sr.title,
        sr.description,
        sr.status,
        sr.created_at
      from service_requests sr
      join companies c on c.id = sr.requester_company_id
      join service_categories sc on sc.id = sr.category_id
      ${where}
      order by sr.created_at desc
      limit $2
      `,
      [user.companyId, q.limit]
    )

    return {
      items: res.rows.map((r) => ({
        id: r.id,
        requesterCompany: { id: r.requester_company_id, name: r.requester_company_name },
        category: { id: r.category_id, name: r.category_name },
        title: r.title,
        description: r.description,
        status: r.status,
        createdAt: r.created_at
      }))
    }
  })

  app.post('/service-requests/:id/proposals', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const requestId = String(req.params.id)
    const body = createProposalSchema.parse(req.body)

    const sr = await pool.query<{ requester_company_id: string; status: string }>(
      'select requester_company_id, status from service_requests where id = $1',
      [requestId]
    )
    const row = sr.rows[0]
    if (!row) return reply.code(404).send({ message: 'Service request not found' })
    if (row.requester_company_id === user.companyId) return reply.code(400).send({ message: 'Cannot propose to yourself' })
    if (row.status !== 'OPEN' && row.status !== 'NEGOTIATING') return reply.code(400).send({ message: 'Request not open' })

    const res = await pool.query<{ id: string }>(
      `
      insert into service_proposals (request_id, provider_company_id, status, price_cents, message)
      values ($1, $2, 'SENT', $3, $4)
      on conflict (request_id, provider_company_id) do update
      set status = 'SENT', price_cents = excluded.price_cents, message = excluded.message, updated_at = now()
      returning id
      `,
      [requestId, user.companyId, body.priceCents ?? null, body.message ?? null]
    )

    await pool.query("update service_requests set status = 'NEGOTIATING', updated_at = now() where id = $1", [requestId])

    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.post('/service-proposals/:id/accept', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const proposalId = String(req.params.id)

    const res = await pool.query<{
      request_id: string
      provider_company_id: string
      requester_company_id: string
      request_status: string
      proposal_status: string
    }>(
      `
      select
        sp.request_id,
        sp.provider_company_id,
        sr.requester_company_id,
        sr.status as request_status,
        sp.status as proposal_status
      from service_proposals sp
      join service_requests sr on sr.id = sp.request_id
      where sp.id = $1
      `,
      [proposalId]
    )
    const row = res.rows[0]
    if (!row) return reply.code(404).send({ message: 'Proposal not found' })
    if (row.requester_company_id !== user.companyId) return reply.code(403).send({ message: 'Forbidden' })
    if (row.proposal_status !== 'SENT') return reply.code(400).send({ message: 'Proposal not sendable' })
    if (row.request_status !== 'OPEN' && row.request_status !== 'NEGOTIATING') return reply.code(400).send({ message: 'Request not open' })

    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query("update service_proposals set status = 'ACCEPTED', updated_at = now() where id = $1", [
        proposalId
      ])
      await client.query("update service_requests set status = 'ACCEPTED', updated_at = now() where id = $1", [
        row.request_id
      ])
      const jobRes = await client.query<{ id: string }>(
        `
        insert into service_jobs (request_id, proposal_id, requester_company_id, provider_company_id, status)
        values ($1, $2, $3, $4, 'ACCEPTED')
        on conflict (request_id) do nothing
        returning id
        `,
        [row.request_id, proposalId, row.requester_company_id, row.provider_company_id]
      )
      await client.query('commit')
      return { ok: true, jobId: jobRes.rows[0]?.id ?? null }
    } catch (err) {
      await client.query('rollback')
      throw err
    } finally {
      client.release()
    }
  })

  app.post('/service-proposals/:id/reject', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const proposalId = String(req.params.id)

    const res = await pool.query<{ request_id: string; requester_company_id: string; status: string }>(
      `
      select sp.request_id, sr.requester_company_id, sp.status
      from service_proposals sp
      join service_requests sr on sr.id = sp.request_id
      where sp.id = $1
      `,
      [proposalId]
    )
    const row = res.rows[0]
    if (!row) return reply.code(404).send({ message: 'Proposal not found' })
    if (row.requester_company_id !== user.companyId) return reply.code(403).send({ message: 'Forbidden' })
    if (row.status !== 'SENT') return reply.code(400).send({ message: 'Proposal not sendable' })

    await pool.query("update service_proposals set status = 'REJECTED', updated_at = now() where id = $1", [proposalId])
    return { ok: true }
  })

  app.get('/service-jobs', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const q = z
      .object({
        limit: z.coerce.number().int().min(1).max(50).default(20)
      })
      .parse(req.query ?? {})

    const res = await pool.query<{
      id: string
      status: string
      requester_company_id: string
      requester_company_name: string
      provider_company_id: string
      provider_company_name: string
      created_at: string
    }>(
      `
      select
        sj.id,
        sj.status,
        sj.requester_company_id,
        cr.name as requester_company_name,
        sj.provider_company_id,
        cp.name as provider_company_name,
        sj.created_at
      from service_jobs sj
      join companies cr on cr.id = sj.requester_company_id
      join companies cp on cp.id = sj.provider_company_id
      where sj.requester_company_id = $1 or sj.provider_company_id = $1
      order by sj.created_at desc
      limit $2
      `,
      [user.companyId, q.limit]
    )

    return {
      items: res.rows.map((r) => ({
        id: r.id,
        status: r.status,
        requesterCompany: { id: r.requester_company_id, name: r.requester_company_name },
        providerCompany: { id: r.provider_company_id, name: r.provider_company_name },
        createdAt: r.created_at
      }))
    }
  })
}

