import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Explicitly configure Turbopack root to eliminate parent lockfile inference warnings
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Output standalone for Docker multi-stage build
  output: "standalone",

  // API proxy — avoids CORS issues in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"}/:path*`,
      },
    ];
  },

  // Image domains (for patient profile pictures served from Django media)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },

  // Strict type-checking during builds
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
