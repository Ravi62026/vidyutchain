import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef3f0] text-[#172525]">
        <div className="rounded-lg border border-[#d5e0da] bg-[#f8faf7] px-6 py-4 shadow-sm">
          Restoring secure session…
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isRestoring } = useAuth()

  if (isRestoring) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return children
}

