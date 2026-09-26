import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    // Smaller files than JPEG/PNG for every optimized image
    formats: ["image/avif", "image/webp"],
    // Optimized images are cached for a year; our photos are static imports with
    // content-hashed URLs, so a changed photo gets a new URL anyway
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  // Overridable build dir: `NEXT_DIST_DIR=.next-verify pnpm build` runs a
  // verification build without breaking a running dev server on `.next`
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Tree-shake per-import from the full Central Icons sets (~2k icons each)
    // so only the icons actually imported get bundled.
    optimizePackageImports: [
      "@central-icons-react/round-outlined-radius-3-stroke-1.5",
      "@central-icons-react/round-filled-radius-3-stroke-1.5",
    ],
  },
};

// Picks up src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
