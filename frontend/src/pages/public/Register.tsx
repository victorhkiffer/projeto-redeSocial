import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function Register() {
  const auth = useAuth()
  const nav = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await auth.register({ companyName, representativeName, email, password })
      nav('/app/feed', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Cadastro</h1>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Nome da empresa</div>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Seu nome (representante)</div>
            <input
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <div className="mb-1 text-[color:var(--muted)]">E-mail</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <div className="mb-1 text-[color:var(--muted)]">Senha</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2"
            />
          </label>

          {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              disabled={loading}
              type="submit"
              className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
            >
              {loading ? 'Criando…' : 'Criar conta'}
            </button>
            <Link to="/login" className="text-sm underline">
              Já tenho conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
