import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../auth/AuthContext'

const nav = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/feed', label: 'Feed' },
  { to: '/app/pesquisa', label: 'Pesquisa' },
  { to: '/app/servicos', label: 'Serviços' },
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/avaliacoes', label: 'Avaliações' },
  { to: '/app/representantes', label: 'Representantes' },
  { to: '/app/configuracoes/perfil', label: 'Perfil' },
]

export default function AppLayout() {
  const auth = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)] bg-[color:var(--card)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[color:var(--primary)]" />
            <span className="font-semibold">Conecta Empreendedor</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm',
                    isActive
                      ? 'bg-[color:var(--primary)] text-white'
                      : 'hover:bg-black/5 dark:hover:bg-white/10',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
