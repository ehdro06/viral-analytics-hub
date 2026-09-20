import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Where each backend service lives. Defaults are the local dev ports; in production set these to the
// deployed service URLs (they are read at build time on Vercel).
const USER_SERVICE = process.env.USER_SERVICE_URL ?? "http://localhost:8080";
const REDIRECT_SERVICE = process.env.REDIRECT_SERVICE_URL ?? "http://localhost:8081";
const ANALYTICS_SERVICE = process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:8082";

// The browser only ever talks to the Next.js origin; these rewrites proxy to the right service.
// (A dedicated API gateway is planned to replace this.)
const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in a parent folder otherwise confuses Turbopack)
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  async rewrites() {
    return [
      // Expander (public utility)
      { source: "/api/v1/expand", destination: `${REDIRECT_SERVICE}/api/expand` },
      // Link management
      { source: "/api/v1/links/:path*", destination: `${REDIRECT_SERVICE}/api/v1/links/:path*` },
      // Analytics
      { source: "/api/v1/analytics/:path*", destination: `${ANALYTICS_SERVICE}/api/v1/analytics/:path*` },
      // User service: auth, profile
      { source: "/api/:path*", destination: `${USER_SERVICE}/api/:path*` },
      { source: "/login/oauth2/:path*", destination: `${USER_SERVICE}/login/oauth2/:path*` },
      { source: "/oauth2/:path*", destination: `${USER_SERVICE}/oauth2/:path*` },
      { source: "/logout", destination: `${USER_SERVICE}/logout` },
    ];
  },
};

export default nextConfig;
