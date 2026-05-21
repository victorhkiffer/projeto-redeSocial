import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { pool } from '../db'

export type AuthUser = {
  representativeId: string
  companyId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  email: string
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser
  }
}

export function requireAuth(app: FastifyInstance) {
  return async function preHandler(request: any, reply: any) {
    await request.jwtVerify()

    const user = request.user as any
    const representativeId: string | undefined = user?.sub
    const companyId: string | undefined = user?.companyId
    const role: AuthUser['role'] | undefined = user?.role
    const email: string | undefined = user?.email

    if (!representativeId || !companyId || !role || !email) {
      return reply.code(401).send({ message: 'Invalid token' })
    }

    const repRes = await pool.query<{ status: string }>('select status from representatives where id = $1', [
      representativeId
    ])
    const rep = repRes.rows[0]
    if (!rep) return reply.code(401).send({ message: 'Invalid token' })
    if (rep.status !== 'ACTIVE') return reply.code(403).send({ message: 'Representative not active' })

    request.authUser = { representativeId, companyId, role, email }
  }
}

export function requireCompanyRole(roles: AuthUser['role'][]): FastifyPluginAsync {
  return async function rolePlugin(app) {
    app.addHook('preHandler', async (request: any, reply) => {
      const user = request.authUser
      if (!user) return reply.code(401).send({ message: 'Unauthorized' })
      if (!roles.includes(user.role)) return reply.code(403).send({ message: 'Forbidden' })
    })
  }
}

