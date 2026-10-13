"use client";

import { createContext, useContext } from "react";
import type { Module } from "@/server/rbac/catalog";

export interface ShellWorkspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  roleName: string;
}

export interface ShellUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface ShellState {
  org: { id: string; name: string; slug: string; logoUrl: string | null };
  roleName: string;
  user: ShellUser;
  workspaces: ShellWorkspace[];
  /** Modules the member may `view`. */
  modules: Module[];
  /** Modules the member may `create` in. */
  creatableModules: Module[];
}

interface ShellContextValue extends ShellState {
  paletteOpen: boolean;
  setPaletteOpen(open: boolean): void;
  shortcutsOpen: boolean;
  setShortcutsOpen(open: boolean): void;
  mobileNavOpen: boolean;
  setMobileNavOpen(open: boolean): void;
  quickCreateOpen: boolean;
  setQuickCreateOpen(open: boolean): void;
  href(path: string): string;
  canView(module: Module | undefined): boolean;
  canCreate(module: Module | undefined): boolean;
}

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <AppShell>");
  return ctx;
}
