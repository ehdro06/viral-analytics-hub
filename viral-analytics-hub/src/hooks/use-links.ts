import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import { authFetch } from "@/lib/auth-fetch";
import { LinkItem, LinkStatus } from "@/lib/types";

// Shape returned by the redirect service
interface BackendLink {
  id: number;
  shortCode: string;
  longUrl: string;
  createdAt: string;
  userId: number;
  clickCount?: number; // enriched from Redis counters
  paused?: boolean;
  expiresAt?: string | null;
  status?: LinkStatus; // computed by the redirect service
}

export interface LinkStatusUpdate {
  id: string;
  paused: boolean;
  expiresAt: string | null;
}

const mapBackendToFrontend = (link: BackendLink): LinkItem => ({
  id: link.id.toString(),
  shortCode: link.shortCode,
  originalUrl: link.longUrl,
  totalClicks: link.clickCount ?? 0,
  createdAt: link.createdAt,
  status: link.status ?? "active",
  paused: link.paused ?? false,
  expiresAt: link.expiresAt ?? null,
});

/** Backend validation errors carry a human-readable message: surface it instead of a generic failure. */
async function errorFrom(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  return new Error(body?.message ?? fallback);
}

export function useLinks() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  // isPending (not isLoading): the query is disabled until the token arrives, and that must still show a loading state
  const { data: links = [], isPending } = useQuery({
    queryKey: ["links"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/links");
      if (!res.ok) throw new Error("Failed to fetch links");
      const data: BackendLink[] = await res.json();
      return data.map(mapBackendToFrontend);
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !!token,
  });

  // Create (optimistic: the row appears immediately and is replaced by the real one on success)
  const createMutation = useMutation({
    mutationFn: async (originalUrl: string) => {
      const res = await authFetch("/api/v1/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl: originalUrl }),
      });
      if (!res.ok) throw await errorFrom(res, "Failed to create link");
      return res.json();
    },
    onMutate: async (newUrl) => {
      await queryClient.cancelQueries({ queryKey: ["links"] });
      const previousLinks = queryClient.getQueryData<LinkItem[]>(["links"]);

      queryClient.setQueryData<LinkItem[]>(["links"], (old = []) => [
        {
          id: "temp-" + Date.now(),
          shortCode: "",
          originalUrl: newUrl,
          totalClicks: 0,
          createdAt: new Date().toISOString(),
          status: "active",
          paused: false,
          expiresAt: null,
          pending: true,
        },
        ...old,
      ]);

      return { previousLinks };
    },
    onError: (_err, _newUrl, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links"], context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });

  // Delete (optimistic)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw await errorFrom(res, "Failed to delete link");
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["links"] });
      const previousLinks = queryClient.getQueryData<LinkItem[]>(["links"]);

      queryClient.setQueryData<LinkItem[]>(["links"], (old) =>
        old ? old.filter((link) => link.id !== deletedId) : []
      );

      return { previousLinks };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(["links"], context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });

  // Pause/resume and expiry: both fields are always sent (the backend sets both)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, paused, expiresAt }: LinkStatusUpdate) => {
      const res = await authFetch(`/api/v1/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused, expiresAt }),
      });
      if (!res.ok) throw await errorFrom(res, "Failed to update link");
      return mapBackendToFrontend(await res.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<LinkItem[]>(["links"], (old = []) =>
        old.map((link) => (link.id === updated.id ? { ...link, ...updated, totalClicks: link.totalClicks } : link))
      );
    },
  });

  return {
    links,
    updateLinkStatus: updateStatusMutation.mutateAsync,
    isLoading: isPending,
    createLink: createMutation.mutateAsync,
    deleteLink: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
