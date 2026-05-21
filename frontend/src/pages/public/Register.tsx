import { Link } from 'react-router-dom'

export default function Register() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Cadastro</h1>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">
          Placeholder (v1): cria Empresa + Representante owner via `POST /auth/register`.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm font-medium hover:border-[color:var(--primary)]"
          >
            Ir para login
          </Link>
        </div>
      </div>
    </div>
  )
}
