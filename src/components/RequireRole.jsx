import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Route-level authorization gate. Renders children only if the user has at
 * least one of the given roles; otherwise redirects to the no-permission page.
 * Fail-closed (relies on AuthContext.canDo). Backend still enforces authz.
 */
function RequireRole({ roles = [], children }) {
  const { canDo, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!canDo(...roles)) {
    return <Navigate to="/no-permission" replace />;
  }

  return children;
}

export default RequireRole;
