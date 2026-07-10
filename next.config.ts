import type { NextConfig } from "next";

const AZURE_URL = "https://anomalydetection-c9e2b6abb5hbggb4.francecentral-01.azurewebsites.net";//to work in the cloud
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? AZURE_URL).replace(/\/$/, "");

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
