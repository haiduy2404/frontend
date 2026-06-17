import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * For public pages (login). Redirects to dashboard when a session already exists.
 */
function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <span>Đang tải...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

export default GuestRoute;
