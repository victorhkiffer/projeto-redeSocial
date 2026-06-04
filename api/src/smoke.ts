import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import authRoutes from './routes/auth'
import meRoutes from './routes/me'
import representativesRoutes from './routes/representatives'
import companiesRoutes from './routes/companies'
import postsRoutes from './routes/posts'
import followsRoutes from './routes/follows'
import servicesRoutes from './routes/services'
import reviewsRoutes from './routes/reviews'
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
  await app.register(servicesRoutes)
  await app.register(reviewsRoutes)

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

  const createCategory = await fetch(`${base}/service-categories`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: `Categoria ${Date.now()}` })
  })
  if (!createCategory.ok) throw new Error(`create category failed: ${createCategory.status} ${await createCategory.text()}`)
  const { id: categoryId } = (await createCategory.json()) as { id: string }

  const offering = await fetch(`${base}/service-offerings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ categoryId, title: 'Serviço X', description: 'Descrição', basePriceCents: 10000 })
  })
  if (!offering.ok) throw new Error(`create offering failed: ${offering.status} ${await offering.text()}`)

  const request = await fetch(`${base}/service-requests`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ categoryId, title: 'Preciso de X', description: 'Detalhes' })
  })
  if (!request.ok) throw new Error(`create request failed: ${request.status} ${await request.text()}`)
  const { id: requestId } = (await request.json()) as { id: string }

  const otherLogin = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: otherEmail, password: otherPassword })
  })
  if (!otherLogin.ok) throw new Error(`other login failed: ${otherLogin.status} ${await otherLogin.text()}`)
  const otherTokens = (await otherLogin.json()) as { accessToken: string }

  const proposal = await fetch(`${base}/service-requests/${requestId}/proposals`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${otherTokens.accessToken}` },
    body: JSON.stringify({ priceCents: 12000, message: 'Posso fazer' })
  })
  if (!proposal.ok) throw new Error(`create proposal failed: ${proposal.status} ${await proposal.text()}`)
  const { id: proposalId } = (await proposal.json()) as { id: string }

  const reject = await fetch(`${base}/service-proposals/${proposalId}/reject`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!reject.ok) throw new Error(`reject proposal failed: ${reject.status} ${await reject.text()}`)

  const proposal2 = await fetch(`${base}/service-requests/${requestId}/proposals`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${otherTokens.accessToken}` },
    body: JSON.stringify({ priceCents: 11000, message: 'Posso fazer melhor' })
  })
  if (!proposal2.ok) throw new Error(`create proposal2 failed: ${proposal2.status} ${await proposal2.text()}`)
  const { id: proposalId2 } = (await proposal2.json()) as { id: string }

  const accept = await fetch(`${base}/service-proposals/${proposalId2}/accept`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!accept.ok) throw new Error(`accept proposal failed: ${accept.status} ${await accept.text()}`)
  const { jobId } = (await accept.json()) as { jobId: string }
  if (!jobId) throw new Error('accept did not return jobId')

  const jobs = await fetch(`${base}/service-jobs?limit=5`, { headers: { authorization: `Bearer ${accessToken}` } })
  if (!jobs.ok) throw new Error(`jobs list failed: ${jobs.status} ${await jobs.text()}`)

  const startJob = await fetch(`${base}/service-jobs/${jobId}/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${otherTokens.accessToken}` },
    body: JSON.stringify({})
  })
  if (!startJob.ok) throw new Error(`start job failed: ${startJob.status} ${await startJob.text()}`)

  const completeJob = await fetch(`${base}/service-jobs/${jobId}/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({})
  })
  if (!completeJob.ok) throw new Error(`complete job failed: ${completeJob.status} ${await completeJob.text()}`)

  const review = await fetch(`${base}/jobs/${jobId}/reviews`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ reviewedCompanyId: otherCompany.id, stars: 5, comment: 'Excelente' })
  })
  if (!review.ok) throw new Error(`review failed: ${review.status} ${await review.text()}`)

  const reviews = await fetch(`${base}/companies/${otherCompany.id}/reviews`, {
    headers: { authorization: `Bearer ${accessToken}` }
  })
  if (!reviews.ok) throw new Error(`company reviews failed: ${reviews.status} ${await reviews.text()}`)

  const ranking = await fetch(`${base}/ranking/categories/${categoryId}`, {
    headers: { authorization: `Bearer ${accessToken}` }
  })
  if (!ranking.ok) throw new Error(`ranking failed: ${ranking.status} ${await ranking.text()}`)

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
