import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface User {
  name: string;
  email: string;
  tier: "FREE" | "PRO";
}

// Fetch user from backend
const fetchUser = async (): Promise<User | null> => {
  const res = await fetch("/api/v1/users/me");
  if (!res.ok) {
     if (res.status === 401) return null;
     throw new Error("Failed to fetch user");
  }
  return res.json();
};

const logoutUser = async () => {
   try {
        await fetch("/logout"); 
    } catch (e) {
        // ignore
    }
}

export function useUser() {
  const { setUser, logout: clearStore } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false, // Don't retry 401s
    staleTime: 1000 * 60 * 5, // 5 minutes (Profile doesn't change often)
  });

  // Sync Zustand with Query Data
  useEffect(() => {
    if (user !== undefined) {
        setUser(user);
    }
  }, [user, setUser]);

  // Handle Logout
  const logout = async () => {
    // If it's a mock user (handled in component potentially, or check email)
    // We can just rely on the store state in most cases, but for real auth:
    await logoutUser();
    
    clearStore();
    queryClient.setQueryData(["user"], null);
    queryClient.removeQueries({ queryKey: ["user"] });
    
    // Hard navigate to clear cookies/state
    window.location.href = "/"; 
  };
  
  // Dev Helper
  const loginWithMock = () => {
      const mockUser: User = {
        name: "Admin User",
        email: "admin@virallink.com",
        tier: "PRO",
      };
      // We manually seed the query cache
      queryClient.setQueryData(["user"], mockUser);
      setUser(mockUser);
      router.push("/analytics");
  }

  return {
    user,
    isLoading,
    isError,
    logout,
    loginWithMock
  };
}
