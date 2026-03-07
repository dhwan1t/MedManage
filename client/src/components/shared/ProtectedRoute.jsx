import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

/**
 * ProtectedRoute — wraps any route that requires authentication and optionally a specific role.
 *
 * Props:
 *   - children: the page component to render if access is granted
 *   - roles: (optional) string or array of strings — allowed roles e.g. "admin" or ["hospital", "admin"]
 *
 * Behaviour:
 *   - If auth is still loading, show a simple spinner
 *   - If not authenticated, redirect to /login
 *   - If authenticated but role doesn't match, redirect to / (home)
 *   - Otherwise render children
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles prop is provided, check that the user has one of the allowed roles
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(allowedRoles)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
