import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api, { UNAUTHORIZED_EVENT } from "@/lib/api";
import {
  clearAuthMethod,
  setAuthMethod,
  getStoredAuthMethod,
  type AuthMethod,
} from "@/lib/authRoutes";
import { User, Role } from "@/types";

const ROLE_LEVELS: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  TEAM_MEMBER: 1,
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  authMethod: AuthMethod | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithClerk: (clerkToken: string, mode: "sign-in" | "sign-up") => Promise<void>;
  syncClerkProfile: () => Promise<void>;
  logout: () => void;
  clearAppSession: () => void;
  updateUser: (user: User) => void;
  isClerkUser: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasRole: (minRole: Role) => boolean;
  roleLevel: number;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
  clerkSignOut?: () => Promise<void> | void;
};

function resolveAuthMethod(user: User | null): AuthMethod | null {
  if (!user) return null;
  const stored = getStoredAuthMethod();
  if (stored) return stored;
  if (user.clerkId) return "clerk";
  return "email";
}

export function AuthProvider({ children, clerkSignOut }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("stallion_token"),
    isLoading: true,
    authMethod: null,
  });

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthMethod();
      setState({ user: null, token: null, isLoading: false, authMethod: null });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("stallion_token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false, authMethod: null }));
      return;
    }
    try {
      const { data } = await api.get<User>("/auth/me");
      setState({
        user: data,
        token,
        isLoading: false,
        authMethod: resolveAuthMethod(data),
      });
    } catch {
      localStorage.removeItem("stallion_token");
      clearAuthMethod();
      setState({ user: null, token: null, isLoading: false, authMethod: null });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/auth/login",
      { email, password },
    );
    setAuthMethod("email");
    localStorage.setItem("stallion_token", data.token);
    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      authMethod: "email",
    });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/auth/register",
      { name, email, password },
    );
    setAuthMethod("email");
    localStorage.setItem("stallion_token", data.token);
    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      authMethod: "email",
    });
  }, []);

  const loginWithClerk = useCallback(async (
    clerkToken: string,
    mode: "sign-in" | "sign-up",
  ) => {
    const { data } = await api.post<{ token: string; user: User }>(
      "/auth/clerk",
      { mode },
      { headers: { Authorization: `Bearer ${clerkToken}` } },
    );
    setAuthMethod("clerk");
    localStorage.setItem("stallion_token", data.token);
    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      authMethod: "clerk",
    });
  }, []);

  const syncClerkProfile = useCallback(async () => {
    const { data } = await api.post<User>("/auth/clerk/sync");
    setState((s) => ({
      ...s,
      user: data,
      authMethod: "clerk",
    }));
  }, []);

  const clearAppSession = useCallback(() => {
    localStorage.removeItem("stallion_token");
    clearAuthMethod();
    setState({ user: null, token: null, isLoading: false, authMethod: null });
  }, []);

  const logout = useCallback(() => {
    clearAppSession();
    void clerkSignOut?.();
  }, [clearAppSession, clerkSignOut]);

  const updateUser = useCallback((user: User) => {
    setState((s) => ({
      ...s,
      user,
      authMethod: resolveAuthMethod(user),
    }));
  }, []);

  const userRole = state.user?.role ?? "TEAM_MEMBER";
  const roleLevel = ROLE_LEVELS[userRole] ?? 1;
  const isClerkUser = state.authMethod === "clerk";

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithClerk,
        syncClerkProfile,
        logout,
        clearAppSession,
        updateUser,
        isClerkUser,
        isSuperAdmin: userRole === "SUPER_ADMIN",
        isAdmin: roleLevel >= ROLE_LEVELS["ADMIN"],
        isManager: roleLevel >= ROLE_LEVELS["MANAGER"],
        hasRole: (minRole: Role) => roleLevel >= ROLE_LEVELS[minRole],
        roleLevel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
