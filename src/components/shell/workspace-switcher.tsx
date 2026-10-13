"use client";

import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

function OrgBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-bold text-brand dark:bg-brand dark:text-ink",
        className,
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { org, workspaces, roleName, canView, href } = useShell();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent",
          collapsed && "justify-center",
        )}
        aria-label={`Workspace: ${org.name}. Switch workspace`}
      >
        <OrgBadge name={org.name} />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{org.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{roleName}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} asChild>
            <Link href={`/w/${w.slug}/home`} className="gap-2">
              <OrgBadge name={w.name} className="size-6" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{w.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{w.roleName}</span>
              </span>
              {w.id === org.id ? <Check className="size-4" aria-label="Current workspace" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {canView("admin") ? (
          <DropdownMenuItem asChild>
            <Link href={href("/settings")}>
              <Settings /> Workspace settings
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/onboarding?new=1">
            <Plus /> Create workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
