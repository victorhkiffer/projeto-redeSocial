export const apiBaseUrl: string = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3333'

export type ApiError = {
  message?: string
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const url = `${apiBaseUrl}${path}`
  const headers = new Headers(options.headers)
  headers.set('content-type', 'application/json')
  if (options.token) headers.set('authorization', `Bearer ${options.token}`)

  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => null)
    }
    const message =
      typeof body === 'object' && body && 'message' in body ? String((body as any).message) : `HTTP ${res.status}`
    const err = new Error(message) as Error & { status?: number; body?: unknown }
    err.status = res.status
    err.body = body
    throw err
  }
  return (await res.json()) as T
}

