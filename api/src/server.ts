import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './env'
import { pool } from './db'
import authRoutes from './routes/auth'
import meRoutes from './routes/me'
import representativesRoutes from './routes/representatives'
import companiesRoutes from './routes/companies'
import postsRoutes from './routes/posts'
import followsRoutes from './routes/follows'
import servicesRoutes from './routes/services'

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
await app.register(meRoutes)
await app.register(representativesRoutes)
await app.register(companiesRoutes)
await app.register(postsRoutes)
await app.register(followsRoutes)
await app.register(servicesRoutes)

const address = await app.listen({ host: '0.0.0.0', port: env.PORT })
app.log.info({ address }, 'server listening')
