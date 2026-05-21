import { useEffect, useState } from 'react'
import { applyTheme, getStoredTheme, setStoredTheme } from '../lib/theme'
import type { ThemeMode } from '../lib/theme'

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = getStoredTheme()
    const initial: ThemeMode =
      stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setMode(initial)
    applyTheme(initial)
  }, [])

  function toggle() {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    setStoredTheme(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {mode === 'dark' ? 'Tema: Escuro' : 'Tema: Claro'}
    </button>
  )
}
