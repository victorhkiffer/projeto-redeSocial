import { Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)] bg-[color:var(--card)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[color:var(--primary)]" />
            <span className="font-semibold">Conecta Empreendedor</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
