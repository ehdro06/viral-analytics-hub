"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  name: string;
  email: string;
  tier: "FREE" | "PRO";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithMock: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/v1/users/me");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMock = () => {
    // Mock User for Dev/Testing as requested
    const mockUser: User = {
      name: "Admin User",
      email: "admin@virallink.com",
      tier: "PRO",
    };
    setUser(mockUser);
    router.push("/analytics");
  };

  const logout = async () => {
    // If it's the mock user, just clear state
    if (user?.email === "admin@virallink.com") {
        setUser(null);
        router.push("/login");
        return;
    }

    // Call backend logout
    try {
        await fetch("/logout"); 
        // Spring Security default logout usually redirects, but we might need to conform to it
        // Ideally we hit the endpoint
    } catch (e) {
        // ignore
    }
    setUser(null);
    window.location.href = "/"; // Full refresh to clear HTTP-only cookies
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
