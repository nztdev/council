import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { RegisterServiceWorker } from "@/components/register-sw";
import { PreviewBanner } from "@/components/preview-banner";
import { basePath } from "@/lib/base-path";

// Fonts are loaded via @font-face in globals.css (self-hosted-friendly
// system stacks) rather than next/font/google, so the build doesn't
// depend on reaching Google Fonts at build time. Swap in real font
// files under public/fonts/ and update the @font-face blocks whenever
// you're ready — the --font-* variable names stay the same.

export const metadata: Metadata = {
  title: "Council",
  description: "Ask the people whose judgement you trust.",
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Council",
  },
};

export const viewport: Viewport = {
  themeColor: "#efece4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone text-ink">
        <AuthProvider>
          <RegisterServiceWorker />
          <PreviewBanner />
          <div className="flex-1 flex flex-col pb-20">{children}</div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
