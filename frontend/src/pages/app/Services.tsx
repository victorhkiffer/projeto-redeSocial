import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

type Category = { id: string; name: string }
type Offering = {
  id: string
  company: { id: string; name: string }
  category: Category
  title: string
  description: string | null
  basePriceCents: number | null
}
type RequestItem = {
  id: string
  requesterCompany: { id: string; name: string }
  category: Category
  title: string
  description: string
  status: string
}
type JobItem = {
  id: string
  status: string
  requesterCompany: { id: string; name: string }
  providerCompany: { id: string; name: string }
}

export default function Services() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState('')

  const [offerings, setOfferings] = useState<Offering[]>([])
  const [offeringCategoryId, setOfferingCategoryId] = useState('')
  const [offeringTitle, setOfferingTitle] = useState('')
  const [offeringDescription, setOfferingDescription] = useState('')
  const [offeringPrice, setOfferingPrice] = useState('')

  const [requestsMine, setRequestsMine] = useState<RequestItem[]>([])
  const [requestsAll, setRequestsAll] = useState<RequestItem[]>([])
  const [requestCategoryId, setRequestCategoryId] = useState('')
  const [requestTitle, setRequestTitle] = useState('')
  const [requestDescription, setRequestDescription] = useState('')

  const [jobs, setJobs] = useState<JobItem[]>([])

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const cats = await apiFetch<{ items: Category[] }>('/service-categories', { token })
      setCategories(cats.items)
      const offs = await apiFetch<{ items: Offering[] }>('/service-offerings?limit=20', { token })
      setOfferings(offs.items)
      const mine = await apiFetch<{ items: RequestItem[] }>('/service-requests?scope=mine&limit=20', { token })
      setRequestsMine(mine.items)
      const all = await apiFetch<{ items: RequestItem[] }>('/service-requests?scope=all&limit=20', { token })
      setRequestsAll(all.items)
      const js = await apiFetch<{ items: JobItem[] }>('/service-jobs?limit=20', { token })
      setJobs(js.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await apiFetch('/service-categories', { method: 'POST', token, body: JSON.stringify({ name: categoryName }) })
      setCategoryName('')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar categoria')
    }
  }

  async function createOffering(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await apiFetch('/service-offerings', {
        method: 'POST',
        token,
        body: JSON.stringify({
          categoryId: offeringCategoryId,
          title: offeringTitle,
          description: offeringDescription || null,
          basePriceCents: offeringPrice ? Number(offeringPrice) : null
        })
      })
      setOfferingTitle('')
      setOfferingDescription('')
      setOfferingPrice('')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar serviço')
    }
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await apiFetch('/service-requests', {
        method: 'POST',
        token,
        body: JSON.stringify({
          categoryId: requestCategoryId,
          title: requestTitle,
          description: requestDescription
        })
      })
      setRequestTitle('')
      setRequestDescription('')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao solicitar serviço')
    }
  }

  async function propose(requestId: string) {
    setError(null)
    try {
      await apiFetch(`/service-requests/${requestId}/proposals`, {
        method: 'POST',
        token,
        body: JSON.stringify({ message: 'Tenho interesse' })
      })
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar proposta')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Serviços</h1>
        <button
          type="button"
          onClick={loadAll}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
        >
          Recarregar
        </button>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
      {loading ? <div className="text-sm text-[color:var(--muted)]">Carregando…</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={createCategory} className="rounded-xl border border-[color:var(--border)] p-4">
          <div className="text-sm font-medium">Categorias</div>
          <div className="mt-2 flex gap-2">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Nova categoria…"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
            >
              Criar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.id} className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs">
                {c.name}
              </span>
            ))}
          </div>
        </form>

        <form onSubmit={createOffering} className="rounded-xl border border-[color:var(--border)] p-4">
          <div className="text-sm font-medium">Cadastrar serviço (oferta)</div>
          <div className="mt-2 grid gap-2">
            <select
              value={offeringCategoryId}
              onChange={(e) => setOfferingCategoryId(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
              required
            >
              <option value="">Selecione a categoria…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={offeringTitle}
              onChange={(e) => setOfferingTitle(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Título do serviço…"
              required
            />
            <input
              value={offeringPrice}
              onChange={(e) => setOfferingPrice(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Preço (centavos) opcional…"
            />
            <textarea
              value={offeringDescription}
              onChange={(e) => setOfferingDescription(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
              rows={3}
              placeholder="Descrição…"
            />
            <button
              type="submit"
              className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={createRequest} className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Solicitar serviço</div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <select
            value={requestCategoryId}
            onChange={(e) => setRequestCategoryId(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
            required
          >
            <option value="">Selecione a categoria…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={requestTitle}
            onChange={(e) => setRequestTitle(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="Título da solicitação…"
            required
          />
          <textarea
            value={requestDescription}
            onChange={(e) => setRequestDescription(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Descrição…"
            required
          />
        </div>
        <div className="mt-2">
          <button
            type="submit"
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
          >
            Solicitar
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--border)]">
          <div className="border-b border-[color:var(--border)] p-3 text-sm font-medium">Minhas solicitações</div>
          <div className="divide-y divide-[color:var(--border)]">
            {requestsMine.length === 0 ? (
              <div className="p-4 text-sm text-[color:var(--muted)]">Nenhuma.</div>
            ) : (
              requestsMine.map((r) => (
                <div key={r.id} className="p-3">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {r.category.name} • {r.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--border)]">
          <div className="border-b border-[color:var(--border)] p-3 text-sm font-medium">Solicitações abertas</div>
          <div className="divide-y divide-[color:var(--border)]">
            {requestsAll.length === 0 ? (
              <div className="p-4 text-sm text-[color:var(--muted)]">Nenhuma.</div>
            ) : (
              requestsAll.map((r) => (
                <div key={r.id} className="p-3">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {r.requesterCompany.name} • {r.category.name} • {r.status}
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => propose(r.id)}
                      className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs hover:border-[color:var(--primary)]"
                    >
                      Enviar proposta (mock)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--border)]">
        <div className="border-b border-[color:var(--border)] p-3 text-sm font-medium">Histórico (jobs)</div>
        <div className="divide-y divide-[color:var(--border)]">
          {jobs.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Nenhum job.</div>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="p-3 text-sm">
                <div className="font-medium">{j.status}</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {j.requesterCompany.name} → {j.providerCompany.name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Ofertas cadastradas</div>
        <div className="mt-2 space-y-2">
          {offerings.length === 0 ? (
            <div className="text-sm text-[color:var(--muted)]">Nenhuma oferta.</div>
          ) : (
            offerings.map((o) => (
              <div key={o.id} className="rounded-xl border border-[color:var(--border)] p-3">
                <div className="text-sm font-medium">{o.title}</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {o.company.name} • {o.category.name}
                  {o.basePriceCents ? ` • ${o.basePriceCents}¢` : ''}
                </div>
                {o.description ? <div className="mt-1 text-sm text-[color:var(--muted)]">{o.description}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
