import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
