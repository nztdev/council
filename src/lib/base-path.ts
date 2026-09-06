// Mirrors the basePath Next.js is configured with in next.config.ts.
// Next's own <Link>/router calls handle this prefix automatically, but
// anywhere we build a URL by hand (service worker registration, forcing
// a full page reload) needs it applied manually.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
