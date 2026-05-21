import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function Login() {
  const auth = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from || '/app/feed'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await auth.login({ email, password })
      nav(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <form className="space-y-3" onSubmit={onSubmit}>
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
              minLength={8}
              required
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
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <Link to="/recuperar-senha" className="text-sm underline">
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </div>
      <p className="text-sm text-[color:var(--muted)]">
        Ainda não tem conta? <Link className="underline" to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  )
}
