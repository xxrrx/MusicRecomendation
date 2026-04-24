import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Wraps a route to require authentication and optionally enforce roles.
 *
 * Props:
 *   allowedRoles?: string[]  — if provided, only users with matching role can access.
 *
 * Redirect logic when role doesn't match:
 *   admin  → /admin
 *   artist → /artist/dashboard
 *   user   → /
 */
function getHomeForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'artist') return '/artist/dashboard';
  return '/';
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user }));
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getHomeForRole(user?.role)} replace />;
  }

  return children;
}
