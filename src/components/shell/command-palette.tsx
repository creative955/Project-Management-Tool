"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Keyboard, Loader2, Moon, PanelLeft, Rows3, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/common/user-avatar";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ALL_NAV_ITEMS, CURRENT_PHASE } from "@/config/navigation";
import { QUICK_CREATE } from "@/config/quick-create";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { searchWorkspace } from "@/server/modules/org/search";
import { useShell } from "./shell-context";

export function CommandPalette() {
  const shell = useShell();
  const { paletteOpen, setPaletteOpen, org, workspaces, canView, canCreate, href } = shell;
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { toggleDensity, toggleSidebar, density } = usePreferences();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 200);

  const search = useQuery({
    queryKey: ["workspace-search", org.slug, debounced],
    queryFn: () => searchWorkspace(org.slug, debounced),
    enabled: paletteOpen && debounced.trim().length >= 2,
  });

  function run(fn: () => void) {
    setPaletteOpen(false);
    setQuery("");
    fn();
  }

  const navItems = ALL_NAV_ITEMS.filter((i) => canView(i.module));
  const actions = QUICK_CREATE.filter((i) => canCreate(i.module));
  const otherWorkspaces = workspaces.filter((w) => w.id !== org.id);
  const people = search.data?.people ?? [];

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={(open) => {
        setPaletteOpen(open);
        if (!open) setQuery("");
      }}
      title="Command palette"
      description="Search people and pages, or run a quick action"
      className="sm:max-w-xl"
    >
      <CommandInput
        placeholder="Search people, pages and actions…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[min(60vh,420px)]">
        <CommandEmpty>
          {search.isFetching ? "Searching…" : "No results. Tasks, deals, employees and invoices become searchable as their modules ship."}
        </CommandEmpty>

        {query.trim().length >= 2 && (people.length > 0 || search.isFetching) ? (
          <CommandGroup heading="People">
            {search.isFetching && people.length === 0 ? (
              <CommandItem disabled value={`loading ${query}`}>
                <Loader2 className="animate-spin" /> Searching…
              </CommandItem>
            ) : null}
            {people.map((p) => (
              <CommandItem
                key={p.memberId}
                value={`person ${p.name ?? ""} ${p.email} ${p.memberId}`}
                keywords={[query]}
                onSelect={() =>
                  run(() => {
                    if (search.data?.canManageMembers) {
                      router.push(href(`/settings/members?q=${encodeURIComponent(p.email)}`));
                    } else {
                      void navigator.clipboard?.writeText(p.email);
                      toast.success(`Copied ${p.email}`);
                    }
                  })
                }
              >
                <UserAvatar name={p.name} email={p.email} image={p.image} className="size-6" />
                <span className="min-w-0 flex-1 truncate">
                  {p.name ?? p.email}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {[p.title, p.department].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {actions.length > 0 ? (
          <CommandGroup heading="Quick actions">
            {actions.map((a) => (
              <CommandItem
                key={a.id}
                value={`action ${a.title}`}
                keywords={a.keywords}
                onSelect={() => run(() => router.push(href(a.href)))}
              >
                <a.icon /> {a.title}
                {a.phase > CURRENT_PHASE ? <CommandShortcut>P{a.phase}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Go to">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`go ${item.title} ${item.href}`}
              keywords={item.keywords}
              onSelect={() => run(() => router.push(href(item.href)))}
            >
              <item.icon /> {item.title}
              {item.phase > CURRENT_PHASE ? <CommandShortcut>P{item.phase}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        {otherWorkspaces.length > 0 ? (
          <CommandGroup heading="Switch workspace">
            {otherWorkspaces.map((w) => (
              <CommandItem
                key={w.id}
                value={`workspace ${w.name}`}
                onSelect={() => run(() => router.push(`/w/${w.slug}/home`))}
              >
                <Building2 /> {w.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Preferences">
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
            <CommandShortcut>⇧T</CommandShortcut>
          </CommandItem>
          <CommandItem value="toggle density compact comfortable" onSelect={() => run(toggleDensity)}>
            <Rows3 /> Use {density === "compact" ? "comfortable" : "compact"} density
            <CommandShortcut>⇧D</CommandShortcut>
          </CommandItem>
          <CommandItem value="toggle sidebar collapse expand" onSelect={() => run(toggleSidebar)}>
            <PanelLeft /> Toggle sidebar
            <CommandShortcut>[</CommandShortcut>
          </CommandItem>
          <CommandItem value="keyboard shortcuts help" onSelect={() => run(() => shell.setShortcutsOpen(true))}>
            <Keyboard /> Keyboard shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
