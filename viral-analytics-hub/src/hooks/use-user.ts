import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Fetch user from backend
const fetchUser = async () => {
  const res = await fetch("/api/v1/users/me");
  if (!res.ok) {
     if (res.status === 401) return null;
     // Allow 403 or other errors to throw?
     return null; 
  }
  return res.json();
};

const logoutUser = async () => {
  try {
    await fetch("/logout", {
        method: "POST",
    }); // Spring Security default logout
  } catch (e) {
    // ignore
  }
};

export function useUser() {
  const { setUser, logout: clearStore } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false, 
    staleTime: 1000 * 60 * 5, 
  });

  // Sync Zustand with Query Data
  useEffect(() => {
    if (userData) {
        // Backend returns: { id, email, name, token }
        const { token, ...userFields } = userData;
        // Default tier to FREE for now
        setUser({ ...userFields, tier: "FREE" }, token);
    } else if (userData === null && !isLoading) {
        // Explicitly clear if null returned (401)
        // clearStore(); // Optional: might cause loops if not careful
    }
  }, [userData, setUser, isLoading]);

  // Handle Logout
  const logout = async () => {
    await logoutUser();
    clearStore();
    queryClient.removeQueries({ queryKey: ["user"] });
    window.location.href = "/login";
  };
  
  // Dev Helper
  const loginWithMock = () => {
      const mockUser = {
        id: "mock-1",
        name: "Admin User",
        email: "admin@virallink.com",
        tier: "PRO" as const,
      };
      // We manually seed the query cache
      // queryClient.setQueryData(["user"], { ...mockUser, token: "mock-jwt" });
      setUser(mockUser, "mock-jwt-token-xyz");
      router.push("/");
  }

  return {
    user: userData, // This will be the full response including token, but component usually just needs user
    isLoading,
    isError,
    logout,
    loginWithMock
  };
}
