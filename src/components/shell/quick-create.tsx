"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENT_PHASE } from "@/config/navigation";
import { QUICK_CREATE } from "@/config/quick-create";
import { useShell } from "./shell-context";

export function QuickCreate() {
  const { canCreate, href, quickCreateOpen, setQuickCreateOpen } = useShell();
  const router = useRouter();
  const items = QUICK_CREATE.filter((i) => canCreate(i.module));

  return (
    <DropdownMenu open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" aria-label="Quick create" title="Quick create (Q)">
          <Plus />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={() => router.push(href(item.href))}>
            <item.icon /> {item.title}
            {item.phase > CURRENT_PHASE ? <DropdownMenuShortcut>P{item.phase}</DropdownMenuShortcut> : null}
          </DropdownMenuItem>
        ))}
        {items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Your role can&apos;t create items yet.</p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
