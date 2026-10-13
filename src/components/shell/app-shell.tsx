"use client";

import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useHotkeys } from "@/hooks/use-hotkeys";
import type { Module } from "@/server/rbac/catalog";
import { CommandPalette } from "./command-palette";
import { ShellContext, type ShellState } from "./shell-context";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { DesktopSidebar, SidebarContent } from "./sidebar";
import { TopBar } from "./top-bar";

export function AppShell({ state, children }: { state: ShellState; children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { toggleDensity, toggleSidebar } = usePreferences();

  useEffect(() => setMobileNavOpen(false), [pathname]);

  const href = useCallback((path: string) => `/w/${state.org.slug}${path}`, [state.org.slug]);
  const viewable = useMemo(() => new Set<Module>(state.modules), [state.modules]);
  const creatable = useMemo(() => new Set<Module>(state.creatableModules), [state.creatableModules]);

  const value = useMemo(
    () => ({
      ...state,
      paletteOpen,
      setPaletteOpen,
      shortcutsOpen,
      setShortcutsOpen,
      mobileNavOpen,
      setMobileNavOpen,
      quickCreateOpen,
      setQuickCreateOpen,
      href,
      canView: (m: Module | undefined) => (m ? viewable.has(m) : true),
      canCreate: (m: Module | undefined) => (m ? creatable.has(m) : true),
    }),
    [state, paletteOpen, shortcutsOpen, mobileNavOpen, quickCreateOpen, href, viewable, creatable],
  );

  useHotkeys({
    "mod+k": () => setPaletteOpen((o) => !o),
    "/": () => setPaletteOpen(true),
    "?": () => setShortcutsOpen(true),
    q: () => setQuickCreateOpen(true),
    "[": toggleSidebar,
    "shift+t": () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    "shift+d": toggleDensity,
    "g h": () => router.push(href("/home")),
    "g i": () => router.push(href("/inbox")),
    "g e": () => router.push(href("/everything")),
    "g s": () => router.push(href("/settings")),
  });

  return (
    <ShellContext.Provider value={value}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <DesktopSidebar />
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Workspace navigation</SheetDescription>
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <ShortcutsDialog />
    </ShellContext.Provider>
  );
}
