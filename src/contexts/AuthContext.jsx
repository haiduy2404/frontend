import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, logout as logoutRequest } from "../services/authService";

const AuthContext = createContext(null);

/**
 * canDo(...roleCodes): returns true only when the user explicitly has at least
 * one of the given roles. Fail-closed: empty/missing roles deny everything.
 * Authorization is still enforced by the backend; this only gates the UI.
 */
function buildCanDo(roles) {
  const set = new Set(roles || []);
  return (...codes) => codes.some((c) => set.has(c));
}

// status: "loading" | "authenticated" | "unauthenticated"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  const loadUser = useCallback(async () => {
    setStatus("loading");
    try {
      const u = await getMe();
      setUser(u);
      setStatus("authenticated");
      return u;
    } catch (err) {
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // React to global auth events fired by the axios interceptor.
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setStatus("unauthenticated");
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const roles = user?.roles ?? [];

  const value = {
    user,
    roles,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    canDo: buildCanDo(roles),
    refreshUser: loadUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
