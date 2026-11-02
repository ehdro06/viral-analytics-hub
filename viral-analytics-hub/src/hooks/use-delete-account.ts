import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "./use-auth-store";

/**
 * Deletes the account everywhere: links (redirect service), click data (analytics service), then the account itself
 * (user service). The account goes last because deleting it ends the session the first two steps still need. Each
 * step is idempotent, so after a failure simply trying again completes the deletion.
 */
async function deleteAccount() {
  const steps: [string, string][] = [
    ["/api/v1/links", "your links"],
    ["/api/v1/analytics/me", "your click data"],
    ["/api/v1/users/me", "your account"],
  ];
  for (const [url, what] of steps) {
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error(`Could not delete ${what} (${res.status}). Nothing after that was deleted; please try again.`);
  }
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      useAuthStore.getState().logout();
      queryClient.clear();
      window.location.href = "/";
    },
  });
}
