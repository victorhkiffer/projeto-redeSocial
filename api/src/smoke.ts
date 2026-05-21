import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import authRoutes from './routes/auth'
import { env } from './env'

async function main() {
  const app = Fastify({ logger: false })

  await app.register(cors, { origin: env.CORS_ORIGIN })
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET })
  await app.register(authRoutes)

  await app.listen({ host: '127.0.0.1', port: env.PORT })

  const base = `http://127.0.0.1:${env.PORT}`
  const email = `owner+${Date.now()}@example.com`
  const password = 'password123'

  const reg = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Empresa Teste',
      representativeName: 'Owner Teste',
      email,
      password
    })
  })
  if (!reg.ok) throw new Error(`register failed: ${reg.status} ${await reg.text()}`)

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!login.ok) throw new Error(`login failed: ${login.status} ${await login.text()}`)
  const { refreshToken } = (await login.json()) as { refreshToken: string }

  const refresh = await fetch(`${base}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  if (!refresh.ok) throw new Error(`refresh failed: ${refresh.status} ${await refresh.text()}`)

  const logout = await fetch(`${base}/auth/logout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  if (!logout.ok) throw new Error(`logout failed: ${logout.status} ${await logout.text()}`)

  await app.close()
  console.log('SMOKE_OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

