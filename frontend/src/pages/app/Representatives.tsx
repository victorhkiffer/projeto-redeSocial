import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

type MeResponse = {
  company: { id: string; name: string }
  representative: { id: string; role: string }
}

type Representative = {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

export default function Representatives() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [me, setMe] = useState<MeResponse | null>(null)
  const [items, setItems] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER')

  const canManage = useMemo(() => me?.representative.role === 'OWNER' || me?.representative.role === 'ADMIN', [me])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const meRes = await apiFetch<MeResponse>('/me', { token })
      setMe(meRes)
      const repsRes = await apiFetch<{ items: Representative[] }>(`/companies/${meRes.company.id}/representatives`, {
        token
      })
      setItems(repsRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar representantes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createRepresentative(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setError(null)
    try {
      await apiFetch<{ id: string }>(`/companies/${me.company.id}/representatives`, {
        method: 'POST',
        token,
        body: JSON.stringify({ name, email, password, role })
      })
      setName('')
      setEmail('')
      setPassword('')
      setRole('MEMBER')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar representante')
    }
  }

  async function action(id: string, kind: 'approve' | 'reject' | 'disable') {
    setError(null)
    try {
      await apiFetch(`/representatives/${id}/${kind}`, { method: 'POST', token, body: JSON.stringify({}) })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na ação')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Representantes</h1>
          {me ? <div className="text-sm text-[color:var(--muted)]">{me.company.name}</div> : null}
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
        >
          Recarregar
        </button>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

      {canManage ? (
        <form onSubmit={createRepresentative} className="rounded-xl border border-[color:var(--border)] p-4">
          <div className="text-sm font-medium">Cadastrar representante (PENDING)</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <div className="mb-1 text-[color:var(--muted)]">Nome</div>
              <input
                className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                required
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-[color:var(--muted)]">E-mail</div>
              <input
                className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-[color:var(--muted)]">Senha</div>
              <input
                className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                minLength={8}
                required
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-[color:var(--muted)]">Papel</div>
              <select
                className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          </div>
          <div className="mt-3">
            <button
              type="submit"
              className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
            >
              Criar
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
          Somente OWNER/ADMIN pode gerenciar representantes.
        </div>
      )}

      <div className="rounded-xl border border-[color:var(--border)]">
        <div className="border-b border-[color:var(--border)] p-3 text-sm font-medium">Lista</div>
        <div className="divide-y divide-[color:var(--border)]">
          {loading ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Nenhum representante.</div>
          ) : (
            items.map((rep) => (
              <div key={rep.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <div className="text-sm font-medium">{rep.name}</div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {rep.email} • {rep.role} • {rep.status}
                  </div>
                </div>
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => action(rep.id, 'approve')}
                      className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs hover:border-[color:var(--primary)]"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => action(rep.id, 'reject')}
                      className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs hover:border-[color:var(--primary)]"
                    >
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => action(rep.id, 'disable')}
                      className="rounded-lg border border-[color:var(--border)] px-3 py-2 text-xs hover:border-[color:var(--primary)]"
                    >
                      Desativar
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
