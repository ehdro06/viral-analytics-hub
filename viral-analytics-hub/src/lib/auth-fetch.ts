import { useAuthStore } from "@/hooks/use-auth-store";

// One renewal at a time: several requests failing together share the same /me call.
let refreshing: Promise<string | null> | null = null;

/**
 * The JWT is short-lived (1h); the session cookie behind it lasts much longer. GET /api/v1/users/me turns the
 * cookie into a fresh JWT, so an expired token is renewed silently instead of logging the user out.
 */
function refreshToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch("/api/v1/users/me");
      if (!res.ok) return null; // session gone too: really logged out
      const { token, id, ...user } = await res.json();
      useAuthStore.getState().setUser({ ...user, id: String(id) }, token);
      return token as string;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// Long enough for a backend cold start (scale-to-zero JVM services take ~15-30 s), short enough that nobody waits
// forever: after this the request fails with a readable error instead of spinning.
const REQUEST_TIMEOUT_MS = 30_000;

export class RequestTimeoutError extends Error {
  constructor() {
    super("The server took too long to respond. Please try again.");
    this.name = "RequestTimeoutError";
  }
}

function withToken(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers, signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) };
}

async function timedFetch(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") throw new RequestTimeoutError();
    throw err;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let res = await timedFetch(input, withToken(init, useAuthStore.getState().token));

  if (res.status === 401 && typeof window !== "undefined") {
    const token = await refreshToken();
    if (token) {
      res = await timedFetch(input, withToken(init, token)); // retry once with the renewed token
    }
    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
  }

  return res;
}
