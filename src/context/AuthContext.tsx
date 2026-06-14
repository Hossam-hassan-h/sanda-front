import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { authApi, type LoginPayload, type RegisterPayload, type RegisterResponse } from "@/api/auth";
import type { User, UserRole } from "@/api/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  loginFromVerification: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("sanda_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on app load
  useEffect(() => {
    const token = localStorage.getItem("sanda_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi.me()
      .then((u) => {
        setUser(u);
        localStorage.setItem("sanda_user", JSON.stringify(u));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("sanda_user");
        localStorage.removeItem("sanda_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback((u: User | null, token?: string) => {
    setUser(u);
    if (u) localStorage.setItem("sanda_user", JSON.stringify(u));
    else localStorage.removeItem("sanda_user");
    if (token) localStorage.setItem("sanda_token", token);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const { user: u, token } = await authApi.login(payload);
      persist(u, token);
      return u;
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      return await authApi.register(payload);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    persist(null);
    localStorage.removeItem("sanda_token");
  }, [persist]);

  const switchRole = useCallback((role: UserRole) => {
    if (import.meta.env.PROD) return;
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, role };
      localStorage.setItem("sanda_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loginFromVerification = useCallback((user: User, token: string) => {
    persist(user, token);
  }, [persist]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("sanda_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, register, loginFromVerification, logout, switchRole, updateUser }),
    [user, isLoading, login, register, loginFromVerification, logout, switchRole, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
