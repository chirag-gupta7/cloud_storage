/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStore } from "./authStore.js";
import { decodeJwt } from "../utils/jwt.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => authStore.getToken());

  useEffect(() => authStore.subscribe(setToken), []);

  const user = useMemo(() => {
    const payload = decodeJwt(token);
    if (!payload) return null;
    return { email: payload.sub || "", exp: payload.exp || 0 };
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      setToken: (nextToken) => authStore.setToken(nextToken),
      logout: () => authStore.setToken(""),
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export function RequireNoAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/app/drive" replace />;
  return children;
}
