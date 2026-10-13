import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { APP_NAME, APP_TAGLINE, COOKIE_DENSITY, COOKIE_SIDEBAR, type Density } from "@/config/app";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_TAGLINE,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0B" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const density: Density = store.get(COOKIE_DENSITY)?.value === "compact" ? "compact" : "comfortable";
  const sidebarCollapsed = store.get(COOKIE_SIDEBAR)?.value === "collapsed";

  return (
    <html
      lang="en"
      data-density={density}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans">
        <Providers initialDensity={density} initialSidebarCollapsed={sidebarCollapsed}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
