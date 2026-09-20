import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "./use-auth-store";

interface UserResponse {
  id: number;
  email: string;
  name: string;
  tier: "FREE" | "PRO";
  token: string;
}

// The session cookie identifies the user; the response also carries a fresh API token.
const fetchUser = async (): Promise<UserResponse | null> => {
  const res = await fetch("/api/v1/users/me");
  if (!res.ok) return null; // 401 = not logged in
  return res.json();
};

const logoutUser = async () => {
  try {
    await fetch("/logout", { method: "POST" }); // Spring Security default logout
  } catch {
    // ignore: we clear local state either way
  }
};

const TOKEN_REFRESH_MS = 30 * 60 * 1000; // API tokens live for 24h; refresh well before that

export function useUser() {
  const { setUser, logout: clearStore } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: TOKEN_REFRESH_MS,
  });

  // Mirror the query result into the store so non-React code and other hooks can read the token
  useEffect(() => {
    if (userData) {
      const { token, id, ...rest } = userData;
      setUser({ ...rest, id: String(id) }, token);
    }
  }, [userData, setUser]);

  const logout = async () => {
    await logoutUser();
    clearStore();
    queryClient.removeQueries({ queryKey: ["user"] });
    window.location.href = "/login";
  };

  return {
    user: userData,
    isLoading,
    isError,
    logout,
  };
}
