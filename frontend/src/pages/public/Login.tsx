import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">
          Placeholder (v1). Depois conecta na API de autenticação.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/app/feed"
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
          >
            Entrar (mock)
          </Link>
          <Link to="/recuperar-senha" className="px-2 py-2 text-sm underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>
      <p className="text-sm text-[color:var(--muted)]">
        Ainda não tem conta? <Link className="underline" to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  )
}
