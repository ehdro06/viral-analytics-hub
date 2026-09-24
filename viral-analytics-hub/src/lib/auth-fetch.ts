import { useAuthStore } from "@/hooks/use-auth-store";

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    useAuthStore.getState().logout();
    window.location.href = "/login";
  }

  return res;
}
