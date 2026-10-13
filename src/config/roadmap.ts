export interface RoadmapPhase {
  phase: number;
  title: string;
  summary: string;
}

export const ROADMAP: RoadmapPhase[] = [
  { phase: 1, title: "Foundation", summary: "Auth, workspaces, roles, app shell, command palette, design system." },
  { phase: 2, title: "Work hierarchy & views", summary: "Spaces, folders, lists, tasks, statuses, custom fields, list/board/table views." },
  { phase: 3, title: "Planning & collaboration", summary: "Calendar, Gantt, workload, time tracking, docs, forms, comments, inbox." },
  { phase: 4, title: "Automations & search", summary: "Automation engine, templates, global search, goals and sprints." },
  { phase: 5, title: "CRM", summary: "Leads, scoring, conversion, accounts, pipelines, quotes and sales reports." },
  { phase: 6, title: "People", summary: "Employee database, org chart, self-service, onboarding and recruitment." },
  { phase: 7, title: "Leave & attendance", summary: "Policies, accruals, flexi, comp-off, approvals, ledger balances, attendance." },
  { phase: 8, title: "Payroll", summary: "Salary templates, payroll runs, payslips, bank files and journal posting." },
  { phase: 9, title: "Accounting", summary: "Double-entry books, invoices, bills, banking, reconciliation and reports." },
  { phase: 10, title: "Operations", summary: "Deal-to-project handoff, client portal, approvals hub, assets." },
  { phase: 11, title: "Dashboards", summary: "Dashboard builder, prebuilt dashboards and scheduled reports." },
  { phase: 12, title: "Admin & hardening", summary: "Master data, import/export, integrations, API keys, security, E2E tests." },
];

export function roadmapPhase(phase: number): RoadmapPhase | undefined {
  return ROADMAP.find((p) => p.phase === phase);
}
