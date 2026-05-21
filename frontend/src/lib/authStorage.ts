const accessKey = 'ce_access_token'
const refreshKey = 'ce_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(accessKey)
}

export function setAccessToken(token: string | null) {
  if (!token) localStorage.removeItem(accessKey)
  else localStorage.setItem(accessKey, token)
}

export function getRefreshToken() {
  return localStorage.getItem(refreshKey)
}

export function setRefreshToken(token: string | null) {
  if (!token) localStorage.removeItem(refreshKey)
  else localStorage.setItem(refreshKey, token)
}

export function clearTokens() {
  setAccessToken(null)
  setRefreshToken(null)
}

