import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Expander Service (Public Utility)
      {
        source: "/api/v1/expand",
        destination: "http://localhost:8081/api/expand",
      },
      // Redirect Service (Links)
      {
        source: "/api/v1/links/:path*",
        destination: "http://localhost:8081/api/v1/links/:path*",
      },
      // Analytics Service
      {
        source: "/api/v1/analytics/:path*",
        destination: "http://localhost:8082/api/v1/analytics/:path*",
      },
      // User Service (Authentication & Users)
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
      {
        source: "/login/oauth2/:path*",
        destination: "http://localhost:8080/login/oauth2/:path*",
      },
      {
        source: "/oauth2/:path*",
        destination: "http://localhost:8080/oauth2/:path*",
      },
      {
        source: "/logout",
        destination: "http://localhost:8080/logout",
      },
    ];
  },
};

export default nextConfig;
