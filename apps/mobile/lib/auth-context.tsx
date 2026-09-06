import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, saveToken, clearToken } from "@/lib/auth";
import { apiClient, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";
import type { User } from "shared-types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      void (async () => {
        await clearToken();
        setUser(null);
      })();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    }

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setUser(null);
          return;
        }
        try {
          const res = await apiClient.health();
          setUser({ id: res.userId, email: "", createdAt: "" } as User);
        } catch {
          await clearToken();
          setUser(null);
        }
      } catch {
        await clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
      }
    };
  }, []);

  const setSession = async (newUser: User, token: string) => {
    await saveToken(token);
    setUser(newUser);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
