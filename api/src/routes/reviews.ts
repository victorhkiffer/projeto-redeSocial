import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

const createReviewSchema = z.object({
  reviewedCompanyId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable()
})

export default async function reviewsRoutes(app: FastifyInstance) {
  app.post('/jobs/:id/reviews', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const jobId = String(req.params.id)
    const body = createReviewSchema.parse(req.body)

    const jobRes = await pool.query<{
      requester_company_id: string
      provider_company_id: string
      status: string
    }>(
      `
      select requester_company_id, provider_company_id, status
      from service_jobs
      where id = $1
      `,
      [jobId]
    )
    const job = jobRes.rows[0]
    if (!job) return reply.code(404).send({ message: 'Job not found' })
    if (job.status !== 'COMPLETED') return reply.code(400).send({ message: 'Job must be completed before review' })

    const isRequester = job.requester_company_id === user.companyId
    const isProvider = job.provider_company_id === user.companyId
    if (!isRequester && !isProvider) return reply.code(403).send({ message: 'Forbidden' })

    const expectedReviewedCompanyId = isRequester ? job.provider_company_id : job.requester_company_id
    if (body.reviewedCompanyId !== expectedReviewedCompanyId) {
      return reply.code(400).send({ message: 'Reviewed company must be the job counterparty' })
    }

    const res = await pool.query<{ id: string }>(
      `
      insert into reviews (job_id, reviewer_company_id, reviewed_company_id, stars, comment)
      values ($1, $2, $3, $4, $5)
      on conflict (job_id, reviewer_company_id, reviewed_company_id) do update
      set stars = excluded.stars, comment = excluded.comment, created_at = now()
      returning id
      `,
      [jobId, user.companyId, body.reviewedCompanyId, body.stars, body.comment ?? null]
    )

    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.get('/companies/:id/reviews', { preHandler: requireAuth(app) }, async (req: any) => {
    const companyId = String(req.params.id)
    const res = await pool.query<{
      id: string
      job_id: string
      stars: number
      comment: string | null
      created_at: string
      reviewer_company_id: string
      reviewer_company_name: string
    }>(
      `
      select
        r.id,
        r.job_id,
        r.stars,
        r.comment,
        r.created_at,
        r.reviewer_company_id,
        c.name as reviewer_company_name
      from reviews r
      join companies c on c.id = r.reviewer_company_id
      where r.reviewed_company_id = $1
      order by r.created_at desc
      limit 50
      `,
      [companyId]
    )

    const summary = await pool.query<{ average: string | null; total: string }>(
      'select avg(stars)::numeric(10,2) as average, count(*) as total from reviews where reviewed_company_id = $1',
      [companyId]
    )

    return {
      average: summary.rows[0]?.average ? Number(summary.rows[0].average) : null,
      total: Number(summary.rows[0]?.total ?? 0),
      items: res.rows.map((r) => ({
        id: r.id,
        jobId: r.job_id,
        stars: r.stars,
        comment: r.comment,
        createdAt: r.created_at,
        reviewerCompany: { id: r.reviewer_company_id, name: r.reviewer_company_name }
      }))
    }
  })

  app.get('/ranking/categories/:id', { preHandler: requireAuth(app) }, async (req: any) => {
    const categoryId = String(req.params.id)
    const res = await pool.query<{
      id: string
      name: string
      average: string
      total: string
    }>(
      `
      select
        c.id,
        c.name,
        avg(r.stars)::numeric(10,2) as average,
        count(r.id) as total
      from reviews r
      join companies c on c.id = r.reviewed_company_id
      join service_jobs sj on sj.id = r.job_id
      join service_requests sr on sr.id = sj.request_id
      where sr.category_id = $1
      group by c.id, c.name
      having count(r.id) > 0
      order by avg(r.stars) desc, count(r.id) desc, c.name asc
      limit 20
      `,
      [categoryId]
    )

    return {
      items: res.rows.map((r) => ({
        company: { id: r.id, name: r.name },
        average: Number(r.average),
        total: Number(r.total)
      }))
    }
  })
}

