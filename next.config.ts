import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // 90 for illustrations, whose clean edges blur at the default 75.
  images: { qualities: [75, 90] },
  partialPrefetching: true,
  experimental: {
    // Set by the Next.js security upgrade (16.4.3 to 16.4.6).
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
