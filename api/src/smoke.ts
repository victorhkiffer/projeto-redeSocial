import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import authRoutes from './routes/auth'
import meRoutes from './routes/me'
import representativesRoutes from './routes/representatives'
import companiesRoutes from './routes/companies'
import postsRoutes from './routes/posts'
import followsRoutes from './routes/follows'
import { env } from './env'

async function main() {
  const app = Fastify({ logger: false })

  await app.register(cors, { origin: env.CORS_ORIGIN })
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET })
  await app.register(authRoutes)
  await app.register(meRoutes)
  await app.register(representativesRoutes)
  await app.register(companiesRoutes)
  await app.register(postsRoutes)
  await app.register(followsRoutes)

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
  const { refreshToken, accessToken } = (await login.json()) as { refreshToken: string; accessToken: string }

  const meRes = await fetch(`${base}/me`, {
    headers: { authorization: `Bearer ${accessToken}` }
  })
  if (!meRes.ok) throw new Error(`me failed: ${meRes.status} ${await meRes.text()}`)
  const me = (await meRes.json()) as { company: { id: string } }
  const companyId = me.company.id

  const patchCompany = await fetch(`${base}/companies/${companyId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ industry: 'Tecnologia', websiteUrl: 'https://example.com' })
  })
  if (!patchCompany.ok) throw new Error(`patch company failed: ${patchCompany.status} ${await patchCompany.text()}`)

  const createPost = await fetch(`${base}/posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ content: 'Primeiro post (smoke)' })
  })
  if (!createPost.ok) throw new Error(`create post failed: ${createPost.status} ${await createPost.text()}`)
  const { id: postId } = (await createPost.json()) as { id: string }

  const listPosts = await fetch(`${base}/posts?limit=5`, { headers: { authorization: `Bearer ${accessToken}` } })
  if (!listPosts.ok) throw new Error(`list posts failed: ${listPosts.status} ${await listPosts.text()}`)

  const like = await fetch(`${base}/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!like.ok) throw new Error(`like post failed: ${like.status} ${await like.text()}`)

  const comment = await fetch(`${base}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ content: 'Comentário (smoke)' })
  })
  if (!comment.ok) throw new Error(`comment failed: ${comment.status} ${await comment.text()}`)

  const memberEmail = `member+${Date.now()}@example.com`
  const memberPassword = 'password123'

  const createRep = await fetch(`${base}/companies/${companyId}/representatives`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: 'Member Teste', email: memberEmail, password: memberPassword, role: 'MEMBER' })
  })
  if (!createRep.ok) throw new Error(`create representative failed: ${createRep.status} ${await createRep.text()}`)
  const { id: memberId } = (await createRep.json()) as { id: string }

  const pendingLogin = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: memberEmail, password: memberPassword })
  })
  if (pendingLogin.status !== 403) {
    throw new Error(`pending representative should be forbidden, got: ${pendingLogin.status} ${await pendingLogin.text()}`)
  }

  const approve = await fetch(`${base}/representatives/${memberId}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!approve.ok) throw new Error(`approve representative failed: ${approve.status} ${await approve.text()}`)

  const activeLogin = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: memberEmail, password: memberPassword })
  })
  if (!activeLogin.ok) throw new Error(`active representative login failed: ${activeLogin.status} ${await activeLogin.text()}`)

  const otherCompanyName = `Empresa Outra ${Date.now()}`
  const otherEmail = `other+${Date.now()}@example.com`
  const otherPassword = 'password123'
  const otherReg = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      companyName: otherCompanyName,
      representativeName: 'Owner Outro',
      email: otherEmail,
      password: otherPassword
    })
  })
  if (!otherReg.ok) throw new Error(`other register failed: ${otherReg.status} ${await otherReg.text()}`)

  const search = await fetch(`${base}/companies/search?q=${encodeURIComponent('Empresa Outra')}&limit=10`, {
    headers: { authorization: `Bearer ${accessToken}` }
  })
  if (!search.ok) throw new Error(`search companies failed: ${search.status} ${await search.text()}`)
  const searchJson = (await search.json()) as { items: Array<{ id: string; name: string }> }
  const otherCompany = searchJson.items.find((i) => i.name === otherCompanyName)
  if (!otherCompany) throw new Error('search did not return other company')

  const follow = await fetch(`${base}/companies/${otherCompany.id}/follow`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!follow.ok) throw new Error(`follow failed: ${follow.status} ${await follow.text()}`)

  const followingList = await fetch(`${base}/companies/${companyId}/following?limit=5`, {
    headers: { authorization: `Bearer ${accessToken}` }
  })
  if (!followingList.ok) throw new Error(`following list failed: ${followingList.status} ${await followingList.text()}`)

  const unfollow = await fetch(`${base}/companies/${otherCompany.id}/unfollow`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!unfollow.ok) throw new Error(`unfollow failed: ${unfollow.status} ${await unfollow.text()}`)

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
