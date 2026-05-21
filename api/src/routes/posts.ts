import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { pool } from '../db'
import { requireAuth } from '../auth/guard'

const createPostSchema = z.object({
  content: z.string().min(1).max(5000)
})

const addCommentSchema = z.object({
  content: z.string().min(1).max(2000)
})

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20)
})

export default async function postsRoutes(app: FastifyInstance) {
  app.post('/posts', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const body = createPostSchema.parse(req.body)

    const res = await pool.query<{ id: string }>(
      `
      insert into posts (company_id, content)
      values ($1, $2)
      returning id
      `,
      [user.companyId, body.content]
    )

    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.get('/posts', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const query = listQuerySchema.parse(req.query ?? {})

    const res = await pool.query<{
      id: string
      company_id: string
      company_name: string
      content: string
      created_at: string
      likes_count: string
      comments_count: string
      liked_by_me: boolean
    }>(
      `
      select
        p.id,
        p.company_id,
        c.name as company_name,
        p.content,
        p.created_at,
        (select count(*) from post_likes pl where pl.post_id = p.id) as likes_count,
        (select count(*) from post_comments pc where pc.post_id = p.id) as comments_count,
        exists(select 1 from post_likes pl2 where pl2.post_id = p.id and pl2.company_id = $1) as liked_by_me
      from posts p
      join companies c on c.id = p.company_id
      order by p.created_at desc
      limit $2
      `,
      [user.companyId, query.limit]
    )

    return {
      items: res.rows.map((row) => ({
        id: row.id,
        company: { id: row.company_id, name: row.company_name },
        content: row.content,
        createdAt: row.created_at,
        likesCount: Number(row.likes_count),
        commentsCount: Number(row.comments_count),
        likedByMe: row.liked_by_me
      }))
    }
  })

  app.post('/posts/:id/like', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const postId = String(req.params.id)

    await pool.query(
      `
      insert into post_likes (post_id, company_id)
      values ($1, $2)
      on conflict do nothing
      `,
      [postId, user.companyId]
    )

    return { ok: true }
  })

  app.post('/posts/:id/unlike', { preHandler: requireAuth(app) }, async (req: any) => {
    const user = req.authUser!
    const postId = String(req.params.id)

    await pool.query('delete from post_likes where post_id = $1 and company_id = $2', [postId, user.companyId])
    return { ok: true }
  })

  app.post('/posts/:id/comments', { preHandler: requireAuth(app) }, async (req: any, reply) => {
    const user = req.authUser!
    const postId = String(req.params.id)
    const body = addCommentSchema.parse(req.body)

    const res = await pool.query<{ id: string }>(
      `
      insert into post_comments (post_id, company_id, content)
      values ($1, $2, $3)
      returning id
      `,
      [postId, user.companyId, body.content]
    )

    return reply.code(201).send({ id: res.rows[0]?.id })
  })

  app.get('/posts/:id/comments', { preHandler: requireAuth(app) }, async (req: any) => {
    const postId = String(req.params.id)
    const res = await pool.query<{
      id: string
      content: string
      created_at: string
      company_id: string
      company_name: string
    }>(
      `
      select pc.id, pc.content, pc.created_at, pc.company_id, c.name as company_name
      from post_comments pc
      join companies c on c.id = pc.company_id
      where pc.post_id = $1
      order by pc.created_at asc
      limit 50
      `,
      [postId]
    )

    return {
      items: res.rows.map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        company: { id: row.company_id, name: row.company_name }
      }))
    }
  })
}

