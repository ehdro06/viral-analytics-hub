import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import { LinkItem } from "./use-mock-data"; 
// Start reusing existing types, but note backend differences

// Extended Interface matching backend
interface BackendLink {
    id: number;
    shortCode: string;
    longUrl: string;
    createdAt: string;
    userId: number;
}

const mapBackendToFrontend = (link: BackendLink): LinkItem => ({
    id: link.id.toString(),
    shortCode: link.shortCode,
    originalUrl: link.longUrl,
    totalClicks: 0, // Placeholder
    status: "active", // Placeholder
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
        enabled: !!token, 
    });

    // Create Link
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
            return res.json(); // Returns { shortCode, longUrl }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        }
    });

    // Delete Link
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/v1/links/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete link");
        },
        onSuccess: () => {
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
