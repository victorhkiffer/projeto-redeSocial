import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:items-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Conecte empresas. Feche serviços. Gere reputação.
        </h1>
        <p className="text-[color:var(--muted)]">
          Plataforma B2B inspirada no LinkedIn para contratar e oferecer serviços, com chat e avaliações.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
            to="/cadastro"
          >
            Criar conta
          </Link>
          <Link
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2 text-sm font-medium hover:border-[color:var(--primary)]"
            to="/login"
          >
            Entrar
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="text-lg font-semibold">MVP (v1)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[color:var(--muted)]">
          <li>Cadastro/Login como Representante</li>
          <li>Feed com posts, curtidas e comentários</li>
          <li>Serviços: solicitações, propostas e histórico</li>
          <li>Avaliações após conclusão</li>
          <li>Chat entre empresas</li>
        </ul>
      </div>
    </div>
  )
}
