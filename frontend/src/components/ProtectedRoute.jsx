import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Wraps a route to require authentication.
 * Redirects to /login with `from` state so post-login redirect works.
 *
 * Usage:
 *   <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
