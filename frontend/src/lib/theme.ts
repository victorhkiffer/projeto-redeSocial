export type ThemeMode = 'light' | 'dark'

const storageKey = 'ce_theme'

export function getStoredTheme(): ThemeMode | null {
  const value = localStorage.getItem(storageKey)
  if (value === 'light' || value === 'dark') return value
  return null
}

export function setStoredTheme(mode: ThemeMode) {
  localStorage.setItem(storageKey, mode)
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
}

export function initTheme() {
  const stored = getStoredTheme()
  const mode: ThemeMode =
    stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  applyTheme(mode)
  return mode
}
