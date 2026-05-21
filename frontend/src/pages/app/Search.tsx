import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

type CompanyResult = {
  id: string
  name: string
  industry: string | null
  logoUrl: string | null
  followedByMe: boolean
}

export default function Search() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [q, setQ] = useState('')
  const [items, setItems] = useState<CompanyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ items: CompanyResult[] }>(
        `/companies/search?q=${encodeURIComponent(query)}&limit=20`,
        { token }
      )
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na busca')
    } finally {
      setLoading(false)
    }
  }

  async function toggleFollow(c: CompanyResult) {
    setError(null)
    try {
      if (c.followedByMe) {
        await apiFetch(`/companies/${c.id}/unfollow`, { method: 'POST', token, body: JSON.stringify({}) })
      } else {
        await apiFetch(`/companies/${c.id}/follow`, { method: 'POST', token, body: JSON.stringify({}) })
      }
      setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, followedByMe: !x.followedByMe } : x)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao seguir')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Pesquisa</h1>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

      <form onSubmit={onSearch} className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Buscar empresas</div>
        <div className="mt-2 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="Nome da empresa…"
          />
          <button
            disabled={loading}
            type="submit"
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[color:var(--border)]">
        <div className="border-b border-[color:var(--border)] p-3 text-sm font-medium">Resultados</div>
        <div className="divide-y divide-[color:var(--border)]">
          {loading ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Sem resultados.</div>
          ) : (
            items.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <Link to={`/app/empresa/${c.id}`} className="flex items-center gap-3">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-[color:var(--primary)]" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-[color:var(--muted)]">{c.industry ?? '—'}</div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleFollow(c)}
                  className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs hover:border-[color:var(--primary)]"
                >
                  {c.followedByMe ? 'Deixar de seguir' : 'Seguir'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
