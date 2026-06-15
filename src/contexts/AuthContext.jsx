import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, getMe } from "../services/authService";

const AuthContext = createContext(null);

/**
 * canDo(...roleCodes): returns true when user has at least one of the given roles.
 * Special case: if the user has NO roles assigned (empty position), we allow all
 * so the UI is not accidentally locked out while roles are loading or unassigned.
 */
function buildCanDo(roles) {
  return (...codes) => {
    if (!roles || roles.length === 0) return true;
    return codes.some((c) => roles.includes(c));
  };
}

export function AuthProvider({ children, fetchOnMount = false }) {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    if (fetchOnMount) {
      getMe()
        .then((u) => setUser(u))
        .catch(() => {});
    }
  }, [fetchOnMount]);

  const roles = user?.roles ?? [];

  return (
    <AuthContext.Provider value={{ user, roles, canDo: buildCanDo(roles) }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — consume AuthContext.
 * Falls back to a direct localStorage read so it also works in standalone pages
 * that are not wrapped by AuthProvider (e.g. ImportOrderDetailPage).
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  // Fallback for pages outside AuthProvider
  const user = getCurrentUser();
  const roles = user?.roles ?? [];
  return { user, roles, canDo: buildCanDo(roles) };
}
