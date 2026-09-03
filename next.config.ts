import type { NextConfig } from "next";

// Static export: produces a plain HTML/CSS/JS bundle in out/ with no
// Node server required. This is what makes the app deployable to
// GitHub Pages, and it's the same artifact format Capacitor wraps for
// iOS/Android later, so this one setting serves multiple future
// deploy targets at once.
//
// basePath/assetPrefix are driven by an env var so:
// - local dev (`npm run dev`) has no prefix
// - GitHub Pages build sets NEXT_PUBLIC_BASE_PATH="/<repo-name>"
// - Vercel/Capacitor builds leave it unset (served from "/")
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true, // next/image optimization needs a server; we don't use it, but this keeps the door open
  },
  trailingSlash: true, // static hosts serve /path/index.html more reliably with this on
};

export default nextConfig;
