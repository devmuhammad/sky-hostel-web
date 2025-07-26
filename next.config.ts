import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed ignoreBuildErrors and ignoreDuringBuilds for production safety
  // Build will now fail on TypeScript and ESLint errors as intended
};

export default nextConfig;
