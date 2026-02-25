import type { NextConfig } from "next";

const nextConfig = {
  // Cloudflare Pages edge 호환
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
} satisfies NextConfig & Record<string, unknown>;

export default nextConfig;
