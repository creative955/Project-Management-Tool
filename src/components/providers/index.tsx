"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Density } from "@/config/app";
import { PreferencesProvider } from "./preferences-provider";

export function Providers({
  children,
  initialDensity,
  initialSidebarCollapsed,
}: {
  children: React.ReactNode;
  initialDensity: Density;
  initialSidebarCollapsed: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider
          initialDensity={initialDensity}
          initialSidebarCollapsed={initialSidebarCollapsed}
        >
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-right" closeButton />
          </TooltipProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
