import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="p-6">
        <div className="text-sm text-[color:var(--muted)]">Carregando sessão…</div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}

