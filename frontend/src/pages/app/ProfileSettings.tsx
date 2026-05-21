import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

type MeResponse = {
  company: { id: string; name: string }
  representative: { role: string }
}

type Company = {
  id: string
  name: string
  legalName: string | null
  cnpj: string | null
  email: string | null
  phone: string | null
  description: string | null
  websiteUrl: string | null
  industry: string | null
  logoUrl: string | null
}

export default function ProfileSettings() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [me, setMe] = useState<MeResponse | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<Company>>({})
  const [logoUrl, setLogoUrl] = useState('')

  const canEdit = me?.representative.role === 'OWNER' || me?.representative.role === 'ADMIN'

  async function load() {
    setLoading(true)
    setError(null)
    setSaved(null)
    try {
      const meRes = await apiFetch<MeResponse>('/me', { token })
      setMe(meRes)
      const companyRes = await apiFetch<Company>(`/companies/${meRes.company.id}`, { token })
      setCompany(companyRes)
      setForm({
        name: companyRes.name,
        legalName: companyRes.legalName,
        cnpj: companyRes.cnpj,
        email: companyRes.email,
        phone: companyRes.phone,
        description: companyRes.description,
        websiteUrl: companyRes.websiteUrl,
        industry: companyRes.industry
      })
      setLogoUrl(companyRes.logoUrl ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update<K extends keyof Company>(key: K, value: Company[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setError(null)
    setSaved(null)
    try {
      await apiFetch(`/companies/${me.company.id}`, { method: 'PATCH', token, body: JSON.stringify(form) })
      setSaved('Perfil salvo.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar')
    }
  }

  async function onSaveLogo() {
    if (!me) return
    setError(null)
    setSaved(null)
    try {
      await apiFetch(`/companies/${me.company.id}/logo`, {
        method: 'POST',
        token,
        body: JSON.stringify({ logoUrl })
      })
      setSaved('Logo atualizado.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar logo')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Configurações de perfil</h1>
          {company ? <div className="text-sm text-[color:var(--muted)]">{company.name}</div> : null}
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
        >
          Recarregar
        </button>
      </div>

      {loading ? <div className="text-sm text-[color:var(--muted)]">Carregando…</div> : null}
      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
      {saved ? <div className="text-sm text-[color:var(--muted)]">{saved}</div> : null}

      {!canEdit ? (
        <div className="rounded-xl border border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
          Somente OWNER/ADMIN pode editar o perfil.
        </div>
      ) : null}

      <form onSubmit={onSave} className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Dados</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Nome</div>
            <input
              disabled={!canEdit}
              value={String(form.name ?? '')}
              onChange={(e) => update('name', e.target.value)}
              minLength={2}
              required
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Razão social</div>
            <input
              disabled={!canEdit}
              value={String(form.legalName ?? '')}
              onChange={(e) => update('legalName', e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">CNPJ</div>
            <input
              disabled={!canEdit}
              value={String(form.cnpj ?? '')}
              onChange={(e) => update('cnpj', e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">E-mail</div>
            <input
              disabled={!canEdit}
              value={String(form.email ?? '')}
              onChange={(e) => update('email', e.target.value)}
              type="email"
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Telefone</div>
            <input
              disabled={!canEdit}
              value={String(form.phone ?? '')}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Setor</div>
            <input
              disabled={!canEdit}
              value={String(form.industry ?? '')}
              onChange={(e) => update('industry', e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-[color:var(--muted)]">Site</div>
            <input
              disabled={!canEdit}
              value={String(form.websiteUrl ?? '')}
              onChange={(e) => update('websiteUrl', e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-[color:var(--muted)]">Descrição</div>
            <textarea
              disabled={!canEdit}
              value={String(form.description ?? '')}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
            />
          </label>
        </div>
        <div className="mt-3">
          <button
            disabled={!canEdit}
            type="submit"
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Logo</div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="text-sm">
            <div className="mb-1 text-[color:var(--muted)]">URL do logo</div>
            <input
              disabled={!canEdit}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 disabled:opacity-60"
              placeholder="https://..."
            />
          </label>
          <button
            type="button"
            disabled={!canEdit}
            onClick={onSaveLogo}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm hover:border-[color:var(--primary)] disabled:opacity-60"
          >
            Atualizar logo
          </button>
        </div>
        {logoUrl ? (
          <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
            <div className="text-xs text-[color:var(--muted)]">Preview</div>
            <img src={logoUrl} alt="Logo" className="mt-2 h-16 w-16 rounded-lg object-cover" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
