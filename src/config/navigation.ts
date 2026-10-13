import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  Contact,
  FileSpreadsheet,
  FileText,
  Goal,
  Handshake,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  Layers,
  type LucideIcon,
  Megaphone,
  Network,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { Module } from "@/server/rbac/catalog";

export interface NavItem {
  title: string;
  /** Path relative to /w/[orgSlug]. */
  href: string;
  icon: LucideIcon;
  /** Requires `<module>.view`. Omit for items every member sees. */
  module?: Module;
  /** Build phase that delivers this screen. */
  phase: number;
  description: string;
  keywords?: string[];
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const CURRENT_PHASE = 1;

export const PRIMARY_NAV: NavItem[] = [
  { title: "Home", href: "/home", icon: Home, phase: 1, description: "Your workspace overview." },
  {
    title: "Inbox",
    href: "/inbox",
    icon: Inbox,
    phase: 3,
    description: "Mentions, assigned comments, approvals and updates on things you follow.",
  },
  {
    title: "Everything",
    href: "/everything",
    icon: Layers,
    module: "core",
    phase: 2,
    description: "Every task you can access across all Spaces, with saved views and filters.",
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "work",
    title: "Work",
    items: [
      { title: "Docs", href: "/docs", icon: FileText, module: "core", phase: 3, description: "Nested pages, wikis and SOPs with rich text and embeds." },
      { title: "Timesheets", href: "/time", icon: Clock, module: "core", phase: 3, description: "Global timer, weekly timesheets, billable time and approvals." },
      { title: "Goals", href: "/goals", icon: Goal, module: "core", phase: 4, description: "OKRs with targets linked to task completion or numbers." },
      { title: "Dashboards", href: "/dashboards", icon: LayoutDashboard, module: "dashboards", phase: 11, description: "Drag-and-drop dashboards with widgets from every module." },
    ],
  },
  {
    id: "crm",
    title: "Sales (CRM)",
    items: [
      { title: "Leads", href: "/crm/leads", icon: UserPlus, module: "crm", phase: 5, description: "Capture, score, assign and convert leads.", keywords: ["new lead"] },
      { title: "Opportunities", href: "/crm/opportunities", icon: Handshake, module: "crm", phase: 5, description: "Pipelines, stages, forecasts and deal boards.", keywords: ["deals", "pipeline"] },
      { title: "Accounts", href: "/crm/accounts", icon: Building2, module: "crm", phase: 5, description: "Client companies with contacts, deals, projects and invoices." },
      { title: "Contacts", href: "/crm/contacts", icon: Contact, module: "crm", phase: 5, description: "People at your client and prospect companies." },
      { title: "Quotes", href: "/crm/quotes", icon: ScrollText, module: "crm", phase: 5, description: "Quotes from the product catalogue, PDF and email, convert to invoice." },
      { title: "Sales reports", href: "/crm/reports", icon: BarChart3, module: "crm", phase: 5, description: "Conversion, win rate, velocity, deal size and leaderboard." },
    ],
  },
  {
    id: "people",
    title: "People",
    items: [
      { title: "Employees", href: "/hr/employees", icon: Users, module: "hr", phase: 6, description: "Employee database, documents, history and self-service." },
      { title: "Org chart", href: "/hr/org-chart", icon: Network, module: "hr", phase: 6, description: "Interactive reporting tree by department." },
      { title: "Recruitment", href: "/hr/recruitment", icon: Briefcase, module: "hr", phase: 6, description: "Requisitions, job postings, candidate pipeline and offers." },
      { title: "Leave", href: "/hr/leave", icon: CalendarDays, module: "leave", phase: 7, description: "Apply, approve and track leave with ledger-based balances.", keywords: ["apply leave", "time off"] },
      { title: "Attendance", href: "/hr/attendance", icon: CalendarCheck, module: "attendance", phase: 7, description: "Clock in/out, shifts, regularisation and monthly register." },
      { title: "Payroll", href: "/hr/payroll", icon: Wallet, module: "payroll", phase: 8, description: "Salary structures, payroll runs, payslips and bank files." },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      { title: "Invoices", href: "/finance/invoices", icon: Receipt, module: "accounting", phase: 9, description: "Invoices from quotes, billable time or manual; receipts and aging.", keywords: ["new invoice"] },
      { title: "Bills & expenses", href: "/finance/bills", icon: CircleDollarSign, module: "accounting", phase: 9, description: "Vendor bills, expenses, claims and payments." },
      { title: "Banking", href: "/finance/banking", icon: Landmark, module: "accounting", phase: 9, description: "Bank accounts, statement import and reconciliation." },
      { title: "Journals", href: "/finance/journals", icon: FileSpreadsheet, module: "accounting", phase: 9, description: "Double-entry journals, chart of accounts and period locks." },
      { title: "Financial reports", href: "/finance/reports", icon: Banknote, module: "accounting", phase: 9, description: "P&L, balance sheet, trial balance, cash flow and more." },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { title: "Approvals", href: "/ops/approvals", icon: ClipboardCheck, module: "operations", phase: 10, description: "One inbox for every pending approval." },
      { title: "Client delivery", href: "/ops/delivery", icon: Target, module: "operations", phase: 10, description: "Deal-to-project handoff and client portal." },
      { title: "Assets", href: "/ops/assets", icon: Package, module: "operations", phase: 10, description: "Company equipment and assignments." },
      { title: "Announcements", href: "/ops/announcements", icon: Megaphone, module: "operations", phase: 10, description: "Company news and calendar." },
    ],
  },
];

export const SETTINGS_NAV: NavItem[] = [
  { title: "General", href: "/settings", icon: Settings, module: "admin", phase: 1, description: "Organisation profile, currency, fiscal year and working time." },
  { title: "Members", href: "/settings/members", icon: Users, module: "admin", phase: 1, description: "Invite people and manage their roles." },
  { title: "Roles & permissions", href: "/settings/roles", icon: ShieldCheck, module: "admin", phase: 1, description: "What each role can see and do." },
  { title: "Audit log", href: "/settings/audit", icon: BadgeCheck, module: "admin", phase: 1, description: "Who changed what, and when." },
];

export const ALL_NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV,
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...SETTINGS_NAV,
];

export function findNavItem(path: string): NavItem | undefined {
  const normalized = `/${path.replace(/^\/+|\/+$/g, "")}`;
  return [...ALL_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => normalized === item.href || normalized.startsWith(`${item.href}/`));
}

export function orgHref(orgSlug: string, href: string): string {
  return `/w/${orgSlug}${href}`;
}
