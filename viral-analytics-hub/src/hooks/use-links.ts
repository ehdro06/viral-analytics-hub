import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import type { LinkItem } from "@/types/virallink";

// Backend contract for list/create responses
interface BackendLink {
    id: number;
    shortCode: string;
    longUrl: string;
    createdAt: string;
    userId: number;
    clickCount?: number; // provided by backend, transient/enriched from Redis
}

const mapBackendToFrontend = (link: BackendLink): LinkItem => ({
    id: link.id.toString(),
    shortCode: link.shortCode,
    originalUrl: link.longUrl,
    totalClicks: link.clickCount ?? 0,
    status: "active", // TODO: wire to real status when available
    createdAt: link.createdAt,
    rules: []
});

export function useLinks() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch Links
    const { data: links = [], isLoading } = useQuery({
        queryKey: ["links"],
        queryFn: async () => {
             if (!token) return [];
             const res = await fetch("/api/v1/links", {
                 headers: { Authorization: `Bearer ${token}` }
             });
             if (!res.ok) throw new Error("Failed to fetch links");
             const data: BackendLink[] = await res.json();
             return data.map(mapBackendToFrontend);
        },
        refetchInterval: 10000, 
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        enabled: !!token, 
    });

    // Create Link (with Optimistic Update)
    const createMutation = useMutation({
        mutationFn: async (originalUrl: string) => {
            const res = await fetch("/api/v1/links", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ longUrl: originalUrl }),
            });
            if (!res.ok) throw new Error("Failed to create link");
            return res.json(); 
        },
        onMutate: async (newVar) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<LinkItem[]>(["links"]);

            // Optimistically add a placeholder
            queryClient.setQueryData<LinkItem[]>(["links"], (old = []) => [
                {
                    id: 'temp-' + Date.now(),
                    shortCode: '...',
                    originalUrl: newVar,
                    totalClicks: 0,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    rules: []
                },
                ...old,
            ]);

            return { previousLinks };
        },
        onError: (err, newVar, context) => {
            if (context?.previousLinks) {
                queryClient.setQueryData(["links"], context.previousLinks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        }
    });

    // Delete Link (with Optimistic Update)
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/v1/links/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete link");
        },
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<LinkItem[]>(["links"]);

            queryClient.setQueryData<LinkItem[]>(["links"], (old) => 
                old ? old.filter((link) => link.id !== deletedId) : []
            );

            return { previousLinks };
        },
        onError: (err, deletedId, context) => {
            if (context?.previousLinks) {
                queryClient.setQueryData(["links"], context.previousLinks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        }
    });

    return {
        links,
        isLoading,
        createLink: createMutation.mutateAsync,
        deleteLink: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending
    };
}
