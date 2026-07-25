"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// ── Types ──

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** Full response data from /auth/me (includes subscription) */
  authData: any | null;
  /** Re-fetch auth state from server */
  refresh: () => Promise<void>;
  /** Log the user out */
  logout: () => Promise<void>;
}

// ── Context ──

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  authData: null,
  refresh: async () => {},
  logout: async () => {},
});

// ── Session Storage helpers ──

const AUTH_CACHE_KEY = "mitorix_auth_cache";

function getCachedAuth(): { user: any; authData: any } | null {
  try {
    const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedAuth(user: any, authData: any) {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, authData }));
  } catch {}
}

function clearCachedAuth() {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {}
}

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always start with null to match server render and avoid hydration mismatch.
  // Cache is restored inside useEffect (runs only on client).
  const [user, setUser] = useState<any | null>(null);
  const [authData, setAuthData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAuth = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      const userData = res.data.user;
      setUser(userData);
      setAuthData(res.data);
      setCachedAuth(userData, res.data);
    } catch {
      setUser(null);
      setAuthData(null);
      clearCachedAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restore from cache instantly to prevent flicker,
    // then validate with a fresh API call in the background
    const cached = getCachedAuth();
    if (cached?.user) {
      setUser(cached.user);
      setAuthData(cached.authData);
    }
    fetchAuth();
  }, [fetchAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      setAuthData(null);
      clearCachedAuth();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed. Please try again.");
    }
  }, [router]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        authData,
        refresh: fetchAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──

export function useAuth() {
  return useContext(AuthContext);
}
