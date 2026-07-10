import type { NextConfig } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/proxy/:path*",
        destination: `${BASE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
