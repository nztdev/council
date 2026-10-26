import type { Metadata, Viewport } from "next";
// Fonts are bundled with the app (npm packages), not loaded from Google's
// servers - faster, works offline once cached, and no third-party request
// (which matters for EU privacy rules). Each theme picks its own in
// src/app/globals.css; the browser only downloads the ones in use.
import "@fontsource-variable/fraunces/wght.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/themes";
import { BottomNav } from "@/components/bottom-nav";
import { RegisterServiceWorker } from "@/components/register-sw";
import { PreviewBanner } from "@/components/preview-banner";
import { basePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Council",
  description: "Ask the people whose judgement you trust.",
  manifest: `${basePath}/manifest.json`,
  icons: { icon: `${basePath}/icon-192.png` },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Council",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f8f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set again by the script below (before first paint) when
    // the visitor has chosen a different theme, so React is told to expect
    // that attribute to differ from the server-rendered HTML.
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-stone text-ink">
        <ThemeProvider>
          <AuthProvider>
            <RegisterServiceWorker />
            <PreviewBanner />
            <div className="flex-1 flex flex-col pb-20">{children}</div>
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
