import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "./use-auth-store";

export interface ApiKeyItem {
  id: number;
  prefix: string;
  createdAt: string | null;
}

export function useApiKeys() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["api-keys"],
    enabled: !!token,
    queryFn: async (): Promise<ApiKeyItem[]> => {
      const res = await authFetch("/api/v1/users/keys");
      if (!res.ok) throw new Error("Failed to load API keys");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (): Promise<{ key: string; message: string }> => {
      const res = await authFetch("/api/v1/users/keys", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create API key");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  return {
    keys: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    createKey: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    lastCreated: createMutation.data,
    resetCreated: createMutation.reset,
  };
}
