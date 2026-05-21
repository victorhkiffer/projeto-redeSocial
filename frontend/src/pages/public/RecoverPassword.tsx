import { Link } from 'react-router-dom'

export default function RecoverPassword() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Recuperar senha</h1>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">Placeholder (v1).</p>
        <div className="mt-4">
          <Link to="/login" className="text-sm underline">
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  )
}
