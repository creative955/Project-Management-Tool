"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { COOKIE_DENSITY, COOKIE_SIDEBAR, type Density } from "@/config/app";

interface PreferencesValue {
  density: Density;
  setDensity(density: Density): void;
  toggleDensity(): void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed(collapsed: boolean): void;
  toggleSidebar(): void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function PreferencesProvider({
  initialDensity,
  initialSidebarCollapsed,
  children,
}: {
  initialDensity: Density;
  initialSidebarCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [density, setDensityState] = useState<Density>(initialDensity);
  const [sidebarCollapsed, setCollapsedState] = useState(initialSidebarCollapsed);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
    document.documentElement.dataset.density = next;
    writeCookie(COOKIE_DENSITY, next);
  }, []);

  const setSidebarCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    writeCookie(COOKIE_SIDEBAR, next ? "collapsed" : "expanded");
  }, []);

  const value = useMemo<PreferencesValue>(
    () => ({
      density,
      setDensity,
      toggleDensity: () => setDensity(density === "compact" ? "comfortable" : "compact"),
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
    }),
    [density, setDensity, sidebarCollapsed, setSidebarCollapsed],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
