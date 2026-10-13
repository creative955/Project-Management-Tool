"use client";

import { Keyboard, LogOut, Monitor, Moon, Rows3, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { UserAvatar } from "@/components/common/user-avatar";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/server/auth/actions";
import { useShell } from "./shell-context";

export function UserMenu() {
  const { user, roleName, setShortcutsOpen } = useShell();
  const { theme, setTheme } = useTheme();
  const { density, setDensity } = usePreferences();
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full" aria-label="Account menu">
        <UserAvatar name={user.name} email={user.email} image={user.image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.name ?? user.email}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[11px]">{roleName}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={density === "compact"}
          onCheckedChange={(checked) => setDensity(checked ? "compact" : "comfortable")}
        >
          <Rows3 /> Compact density
          <DropdownMenuShortcut>⇧D</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
          <Keyboard /> Keyboard shortcuts
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault();
            startSignOut(() => signOutAction());
          }}
        >
          <LogOut /> {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
