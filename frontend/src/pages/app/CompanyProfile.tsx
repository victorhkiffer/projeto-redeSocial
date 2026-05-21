import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

export default function CompanyProfile() {
  const { id } = useParams()
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [company, setCompany] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    apiFetch(`/companies/${id}`, { token })
      .then(setCompany)
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar empresa'))
  }, [id, token])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Empresa</h1>
      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
      {company ? (
        <div className="rounded-xl border border-[color:var(--border)] p-4">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-[color:var(--primary)]" />
            )}
            <div>
              <div className="text-lg font-semibold">{company.name}</div>
              <div className="text-sm text-[color:var(--muted)]">{company.industry ?? '—'}</div>
            </div>
          </div>
          {company.description ? <p className="mt-3 text-sm text-[color:var(--muted)]">{company.description}</p> : null}
        </div>
      ) : (
        <div className="text-sm text-[color:var(--muted)]">Carregando…</div>
      )}
    </div>
  )
}
