"use client";

import {
  Activity,
  CalendarDays,
  ChartGantt,
  Copy,
  FileText,
  GanttChart,
  Kanban,
  LayoutGrid,
  List,
  type LucideIcon,
  Map as MapIcon,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Sheet,
  SquareStack,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ViewKind =
  | "list"
  | "board"
  | "table"
  | "calendar"
  | "gantt"
  | "timeline"
  | "workload"
  | "activity"
  | "map"
  | "doc"
  | "form"
  | "cards";

export const VIEW_ICONS: Record<ViewKind, LucideIcon> = {
  list: List,
  board: Kanban,
  table: Sheet,
  calendar: CalendarDays,
  gantt: GanttChart,
  timeline: ChartGantt,
  workload: Users,
  activity: Activity,
  map: MapIcon,
  doc: FileText,
  form: SquareStack,
  cards: LayoutGrid,
};

export interface ViewTab {
  id: string;
  name: string;
  kind: ViewKind;
  pinned?: boolean;
  /** When set the tab is a link; otherwise `onSelect` is called. */
  href?: string;
}

export interface ViewsBarProps {
  views: ViewTab[];
  activeId: string;
  onSelect?(id: string): void;
  onAdd?(): void;
  onPin?(id: string, pinned: boolean): void;
  onRename?(id: string): void;
  onDuplicate?(id: string): void;
  onDelete?(id: string): void;
  /** Right-aligned controls (search, filters, …). */
  children?: React.ReactNode;
  className?: string;
}

export function ViewsBar({
  views,
  activeId,
  onSelect,
  onAdd,
  onPin,
  onRename,
  onDuplicate,
  onDelete,
  children,
  className,
}: ViewsBarProps) {
  const ordered = [...views].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const hasMenu = Boolean(onPin || onRename || onDuplicate || onDelete);

  return (
    <div className={cn("flex items-center gap-2 px-[var(--page-padding)]", className)}>
      <nav aria-label="Views" className="-mb-px flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        <ul role="tablist" className="flex items-center gap-1">
          {ordered.map((view) => {
            const Icon = VIEW_ICONS[view.kind];
            const active = view.id === activeId;
            const tabClass = cn(
              "inline-flex h-9 items-center gap-1.5 border-b-2 px-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            );
            const content = (
              <>
                <Icon className="size-4" aria-hidden />
                {view.name}
                {view.pinned ? <Pin className="size-3 text-muted-foreground" aria-label="Pinned" /> : null}
              </>
            );
            return (
              <li key={view.id} role="presentation" className="group flex items-center">
                {view.href ? (
                  <Link href={view.href} role="tab" aria-selected={active} className={tabClass}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" role="tab" aria-selected={active} className={tabClass} onClick={() => onSelect?.(view.id)}>
                    {content}
                  </button>
                )}
                {hasMenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        aria-label={`${view.name} view options`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {onPin ? (
                        <DropdownMenuItem onSelect={() => onPin(view.id, !view.pinned)}>
                          {view.pinned ? <PinOff /> : <Pin />}
                          {view.pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                      ) : null}
                      {onRename ? (
                        <DropdownMenuItem onSelect={() => onRename(view.id)}>
                          <Pencil /> Rename
                        </DropdownMenuItem>
                      ) : null}
                      {onDuplicate ? (
                        <DropdownMenuItem onSelect={() => onDuplicate(view.id)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                      ) : null}
                      {onDelete ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(view.id)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </li>
            );
          })}
        </ul>
        {onAdd ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onAdd}>
            <Plus /> View
          </Button>
        ) : null}
      </nav>
      {children ? <div className="flex shrink-0 items-center gap-2 py-1.5">{children}</div> : null}
    </div>
  );
}
