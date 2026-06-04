import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authFetch } from "@/lib/auth-fetch";

interface MeResponse {
  id: number;
  email: string;
  name: string;
  token: string;
}

const fetchMe = async (): Promise<MeResponse | null> => {
  const res = await authFetch("/api/v1/users/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
};

const logoutSession = async () => {
  try {
    await fetch("/logout", { method: "POST", credentials: "include" });
  } catch {
    // ignore
  }
};

export function useUser() {
  const { token, user, isHydrated, setUser, logout: clearStore, isAuthenticated } =
    useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: meData, isLoading: isMeLoading, isError } = useQuery({
    queryKey: ["user", token],
    queryFn: fetchMe,
    enabled: isHydrated && !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (meData) {
      setUser(
        {
          id: String(meData.id),
          email: meData.email,
          name: meData.name ?? meData.email,
          tier: "FREE",
        },
        meData.token
      );
    }
  }, [meData, setUser]);

  const logout = async () => {
    await logoutSession();
    clearStore();
    queryClient.removeQueries({ queryKey: ["user"] });
    queryClient.removeQueries({ queryKey: ["links"] });
    queryClient.removeQueries({ queryKey: ["analytics-summary"] });
    window.location.href = "/login";
  };

  const loginWithMock =
    process.env.NODE_ENV === "development"
      ? () => {
          router.push("/login");
        }
      : undefined;

  const isLoading = !isHydrated || (!!token && isMeLoading && !user);

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    logout,
    loginWithMock,
  };
}
