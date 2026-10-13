import {
  CalendarPlus,
  CheckSquare,
  FilePlus2,
  type LucideIcon,
  ReceiptText,
  Timer,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { Module } from "@/server/rbac/catalog";

export interface QuickCreateItem {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Path relative to /w/[orgSlug]. */
  href: string;
  module: Module;
  phase: number;
  keywords?: string[];
}

export const QUICK_CREATE: QuickCreateItem[] = [
  { id: "task", title: "New task", icon: CheckSquare, href: "/everything", module: "core", phase: 2 },
  { id: "lead", title: "New lead", icon: UserPlus, href: "/crm/leads", module: "crm", phase: 5, keywords: ["crm", "prospect"] },
  { id: "time", title: "Log time", icon: Timer, href: "/time", module: "core", phase: 3, keywords: ["timesheet", "timer"] },
  { id: "leave", title: "Apply leave", icon: CalendarPlus, href: "/hr/leave", module: "leave", phase: 7, keywords: ["time off", "holiday", "vacation"] },
  { id: "invoice", title: "New invoice", icon: ReceiptText, href: "/finance/invoices", module: "accounting", phase: 9, keywords: ["bill client"] },
  { id: "doc", title: "New doc", icon: FilePlus2, href: "/docs", module: "core", phase: 3 },
  { id: "invite", title: "Invite member", icon: UsersRound, href: "/settings/members?invite=1", module: "admin", phase: 1, keywords: ["user", "teammate"] },
];
