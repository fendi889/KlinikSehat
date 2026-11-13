import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Pembatasan halaman di frontend. Pembatasan sebenarnya tetap ada di backend (middleware role).
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center text-brand-700">Memuat…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={user.dashboard} replace />
  return children
}
