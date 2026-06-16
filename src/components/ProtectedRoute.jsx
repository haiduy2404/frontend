import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Guards routes that require an authenticated session.
 * - while the session is being resolved (/auth/me), shows a loading state
 * - if unauthenticated, redirects to the login page
 *
 * This is a UX guard only; the backend still enforces auth/authz on every call.
 */
function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="auth-loading">
        <span>Đang tải...</span>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
