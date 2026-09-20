import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  tier: "FREE" | "PRO";
}

interface AuthState {
  user: User | null;
  /**
   * Short-lived API token (JWT). Deliberately kept in memory only: it is re-issued from the session cookie
   * by GET /api/v1/users/me on every page load, so it never needs to sit in localStorage where any
   * injected script could read it.
   */
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
