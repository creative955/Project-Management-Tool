"use client";

import { ChevronDown, Folders, PanelLeftClose, PanelLeftOpen, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CURRENT_PHASE, NAV_GROUPS, PRIMARY_NAV, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";
import { WorkspaceSwitcher } from "./workspace-switcher";

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { href } = useShell();
  const pathname = usePathname();
  const target = href(item.href);
  const active = pathname === target || pathname.startsWith(`${target}/`);
  const Icon = item.icon;
  const upcoming = item.phase > CURRENT_PHASE;

  const link = (
    <Link
      href={target}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-[var(--nav-item-height)] items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
        active
          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          {upcoming ? (
            <span
              className={cn(
                "rounded px-1 text-[10px] font-medium tabular-nums",
                active ? "bg-ink/10" : "text-muted-foreground",
              )}
              title={`Planned for phase ${item.phase}`}
            >
              P{item.phase}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

function NavSection({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  if (collapsed) {
    return (
      <div className="space-y-0.5 border-t border-sidebar-border pt-2">
        {items.map((item) => (
          <NavLink key={item.href} item={item} collapsed />
        ))}
      </div>
    );
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground">
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pt-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} collapsed={false} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SpacesSection() {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Spaces</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="rounded">
              <Button variant="ghost" size="icon-xs" disabled aria-label="New Space (available in phase 2)">
                <Plus />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">Spaces arrive in phase 2</TooltipContent>
        </Tooltip>
      </div>
      <div className="mx-2 flex items-start gap-2 rounded-md border border-dashed border-sidebar-border p-2.5 text-xs text-muted-foreground">
        <Folders className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>Spaces, folders and lists will appear here as a drag-and-drop tree.</span>
      </div>
    </div>
  );
}

export function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { canView } = useShell();
  const primary = PRIMARY_NAV.filter((i) => canView(i.module));
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canView(i.module)) }));
  const settings: NavItem = {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    module: "admin",
    phase: 1,
    description: "",
  };

  return (
    <div className="flex h-full flex-col">
      <div className={cn("p-2", collapsed && "px-1.5")}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Main" className={cn("space-y-3 px-2 pb-4", collapsed && "px-1.5")}>
          <div className="space-y-0.5">
            {primary.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
          {groups.map((g) => (
            <NavSection key={g.id} title={g.title} items={g.items} collapsed={collapsed} />
          ))}
          {!collapsed && canView("core") ? <SpacesSection /> : null}
        </nav>
      </ScrollArea>
      {canView("admin") ? (
        <div className={cn("border-t border-sidebar-border p-2", collapsed && "px-1.5")}>
          <NavLink item={settings} collapsed={collapsed} />
        </div>
      ) : null}
    </div>
  );
}

export function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = usePreferences();
  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "relative hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:block",
        sidebarCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
      )}
    >
      <div className="sticky top-0 h-dvh">
        <SidebarContent collapsed={sidebarCollapsed} />
      </div>
      <Button
        variant="outline"
        size="icon-xs"
        onClick={toggleSidebar}
        className="absolute top-[3.25rem] -right-3 z-10 rounded-full bg-background shadow-sm"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={`${sidebarCollapsed ? "Expand" : "Collapse"} sidebar ( [ )`}
      >
        {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>
    </aside>
  );
}
