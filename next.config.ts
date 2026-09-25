import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
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
