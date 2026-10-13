"use client";

import { Bell, BellOff, Menu, Play, Search, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuickCreate } from "./quick-create";
import { useShell } from "./shell-context";
import { UserMenu } from "./user-menu";

function NotificationsButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <BellOff className="mb-2 size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mentions, assignments and approvals will show up here once tasks and comments
            arrive (phase 3).
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimerButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Time tracker" className="gap-1.5 tabular-nums">
          <Timer />
          <span className="hidden lg:inline">0:00:00</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-semibold">Time tracker</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Start a timer against any task. Entries roll up into weekly timesheets and billable
          invoices. Available in phase 3.
        </p>
        <Button size="sm" className="mt-3 w-full" disabled>
          <Play /> Start timer
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function TopBar() {
  const { setPaletteOpen, setMobileNavOpen } = useShell();

  return (
    <div className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-8 w-full max-w-md items-center gap-2 rounded-md border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30"
        aria-label="Search and commands"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 truncate text-left">Search or run a command…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[11px] sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <QuickCreate />
        <TimerButton />
        <NotificationsButton />
        <UserMenu />
      </div>
    </div>
  );
}
