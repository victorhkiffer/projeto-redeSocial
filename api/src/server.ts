import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './env'
import { pool } from './db'
import authRoutes from './routes/auth'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true
})

await app.register(jwt, {
  secret: env.JWT_ACCESS_SECRET
})

app.get('/health', async () => {
  const res = await pool.query('select 1 as ok')
  return { ok: true, db: res.rows[0]?.ok === 1 }
})

await app.register(authRoutes)

const address = await app.listen({ host: '0.0.0.0', port: env.PORT })
app.log.info({ address }, 'server listening')

