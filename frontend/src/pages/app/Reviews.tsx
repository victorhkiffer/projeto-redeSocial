import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

type MeResponse = { company: { id: string; name: string } }
type JobItem = {
  id: string
  status: string
  requesterCompany: { id: string; name: string }
  providerCompany: { id: string; name: string }
}
type ReviewItem = {
  id: string
  stars: number
  comment: string | null
  reviewerCompany: { id: string; name: string }
}

export default function Reviews() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [me, setMe] = useState<MeResponse | null>(null)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const meRes = await apiFetch<MeResponse>('/me', { token })
      setMe(meRes)
      setCompanyId((value) => value || meRes.company.id)
      const jobsRes = await apiFetch<{ items: JobItem[] }>('/service-jobs?limit=50', { token })
      setJobs(jobsRes.items.filter((j) => j.status === 'COMPLETED'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectedJob() {
    return jobs.find((j) => j.id === selectedJobId) ?? null
  }

  function counterpartyId(job: JobItem) {
    if (!me) return ''
    return job.requesterCompany.id === me.company.id ? job.providerCompany.id : job.requesterCompany.id
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    const job = selectedJob()
    if (!job) return
    setError(null)
    try {
      await apiFetch(`/jobs/${job.id}/reviews`, {
        method: 'POST',
        token,
        body: JSON.stringify({ reviewedCompanyId: counterpartyId(job), stars, comment: comment || null })
      })
      setComment('')
      await loadReviews(counterpartyId(job))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao avaliar')
    }
  }

  async function loadReviews(id = companyId) {
    if (!id) return
    setError(null)
    try {
      const res = await apiFetch<{ average: number | null; total: number; items: ReviewItem[] }>(
        `/companies/${id}/reviews`,
        { token }
      )
      setCompanyId(id)
      setAverage(res.average)
      setTotal(res.total)
      setReviews(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao buscar avaliações')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Avaliações</h1>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
        >
          Recarregar
        </button>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
      {loading ? <div className="text-sm text-[color:var(--muted)]">Carregando...</div> : null}

      <form onSubmit={submitReview} className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Avaliar job concluído</div>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_120px]">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
            required
          >
            <option value="">Selecione um job...</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.requesterCompany.name} - {j.providerCompany.name}
              </option>
            ))}
          </select>
          <input
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            type="number"
            min={1}
            max={5}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm md:col-span-2"
            placeholder="Comentario opcional..."
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
        >
          Salvar avaliação
        </button>
      </form>

      <div className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Avaliações por empresa</div>
        <div className="mt-2 flex gap-2">
          <input
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="ID da empresa..."
          />
          <button
            type="button"
            onClick={() => loadReviews()}
            className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
          >
            Buscar
          </button>
        </div>
        <div className="mt-3 text-sm text-[color:var(--muted)]">
          Média: {average ?? '-'} • Total: {total}
        </div>
        <div className="mt-3 divide-y divide-[color:var(--border)]">
          {reviews.length === 0 ? (
            <div className="py-3 text-sm text-[color:var(--muted)]">Nenhuma avaliação.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="py-3 text-sm">
                <div className="font-medium">
                  {r.stars}/5 • {r.reviewerCompany.name}
                </div>
                {r.comment ? <div className="text-[color:var(--muted)]">{r.comment}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
