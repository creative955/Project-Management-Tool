# OpsHub — Progress

Legend: `[x]` done · `[ ]` not started · `[~]` partially done / shell only (detail in notes)

Definition of done for every phase: no TypeScript or lint errors, all tests pass, every
screen has loading/empty/error states and works on mobile, every mutation is
permission-checked on the server and audit-logged, this file updated.

---

## Phase 0 — Planning
- [x] `docs/ARCHITECTURE.md` (stack, folders, data model overview, permission model)
- [x] `docs/PROGRESS.md` (this checklist)

## Phase 1 — Foundation
- [x] Next.js 15 + TypeScript strict + Tailwind v4 + shadcn/ui (Radix) + lucide
- [x] PostgreSQL + Prisma 6 schema for platform models, initial migration
- [x] Base fields on every business table (`orgId`, timestamps, `createdById`, `deletedAt`)
- [x] Auth.js: email + password (bcrypt), Google SSO (env-gated), database sessions
- [x] Sign up, log in, log out, onboarding (create workspace), accept invitation
- [x] Multi-tenant org resolution (`/w/[orgSlug]`), workspace switcher, tenant-scoped Prisma client
- [x] RBAC skeleton: modules × actions × scopes, field groups, 9 system roles, checks
- [x] `orgAction()` mutation wrapper (auth → tenant → RBAC → Zod → transaction → audit)
- [x] Audit log writer with before/after diff
- [x] App shell: collapsible sidebar (drawer on mobile), top bar, Cmd+K palette, quick-create, notifications/timer entry points, profile menu
- [x] Page header + Views Bar component
- [x] Design tokens (CSS variables), dark mode, density toggle, keyboard shortcuts + help dialog
- [x] Settings: General (org profile, currency, FY, timezone, working days/hours), Members (invite, change role, suspend/restore with undo), Roles (permission matrix, read-only), Audit (latest entries)
- [x] Money utilities (bigint minor units, currency exponents, rounding, allocation, FX) with tests
- [x] Seed: 20-person creative agency (locations, departments, designations, grades, members with roles & reporting lines) + client roster data for Phase 5
- [x] Vitest unit tests + DB integration tests (tenant isolation, org bootstrap, audit)

## Phase 2 — Core hierarchy & views
- [ ] Space / Folder / List / Task / Subtask (max depth 7) / Checklist
- [ ] Space settings: icon, colour, privacy, members & permission, feature toggles
- [ ] Statuses (space → folder → list override), status groups, templates
- [ ] Custom field engine (all types incl. formula, relationship, progress) + inheritance
- [ ] Custom task types
- [ ] Task detail side panel + full page
- [ ] List, Board, Table views; Everything view
- [ ] Saved views (filters, group-by, sort, columns; shared/private); Views Bar actions
- [ ] Sidebar Space tree with dnd-kit

## Phase 3 — Planning views, time, docs, forms, collaboration
- [ ] Calendar, Gantt (dependencies, drag, critical path), Timeline, Workload (incl. leave)
- [ ] Task dependencies
- [ ] Time tracking: global timer, manual entries, billable, rates; weekly timesheets + approval
- [ ] Docs (TipTap, nested pages, permissions)
- [ ] Forms (builder, public/internal, submission → record)
- [ ] Comments (threaded, @mentions, assigned comments), attachments, activity log
- [ ] Inbox / notifications, email digests

## Phase 4 — Automations, templates, search
- [ ] Automation engine (triggers, AND/OR conditions, actions) on pg-boss + run log
- [ ] Templates (Space, Folder, List, Task)
- [ ] Global search across modules with type filters (Cmd+K integration)
- [ ] Goals/OKRs, Sprints (points, burndown, velocity)

## Phase 5 — CRM
- [ ] Leads (capture: manual, CSV, form, email, API), statuses, unqualified reason
- [ ] Lead scoring rules, assignment rules (round-robin / by country/source/industry), SLA
- [ ] Atomic lead conversion with duplicate check
- [ ] Accounts, Contacts, Activities timeline
- [ ] Pipelines, stages with probability, opportunity board/list/table, forecast
- [ ] Products, Quotes (PDF, email) → Invoice / Project handoff
- [ ] CRM reports
- [ ] Seed CRM demo data (clients in US, UK, AU, Gulf, India)

## Phase 6 — HR
- [ ] Employee database (encrypted bank/tax), documents with expiry, history, assets
- [ ] Org chart, departments/designations masters
- [ ] Self-service portal
- [ ] Onboarding/offboarding checklists as Core tasks
- [ ] Recruitment ATS: requisitions + approval, postings/careers page, pipeline, scorecards, offers (PDF, e-accept), hire → employee

## Phase 7 — Leave & attendance
- [ ] Leave types & policies (accrual methods, carry-forward, encashment, sandwich, half-day/hourly, notice, attachments, negative balance, probation, applicability, reset cycle)
- [ ] Flexi leave (optional holiday picks / flexi pool) and comp-off with expiry + lapse job
- [ ] Policy assignment by department/location/employment type with effective dates
- [ ] Holiday calendars per location
- [ ] Apply-leave flow with live calculation; multi-level approval, delegation, cancel/withdraw
- [ ] Ledger balances, admin adjustment with reason, year-end job
- [ ] Team calendar, who's out, conflict warnings, workload integration
- [ ] Attendance: clock in/out, shifts, grace, late marks, regularisation, register, LOP/OT
- [ ] Reports + full tests

## Phase 8 — Payroll
- [ ] Statutory config with effective dates (+ accountant-verification notice)
- [ ] Salary templates & components (fixed / % / formula, caps)
- [ ] Payroll run wizard → payslips (PDF), bank file (CSV), journal posting
- [ ] Revisions + arrears, loans/advances (EMI), F&F, reimbursements
- [ ] Reports + tests

## Phase 9 — Accounting
- [ ] Chart of accounts (seeded agency default), journals (balanced, immutable, reversal)
- [ ] Multi-currency, FX gain/loss
- [ ] Customers, invoices (manual / quote / billable time), recurring, credit notes, receipts, aging
- [ ] Vendors, bills, expenses (+ claims), payments
- [ ] Tax rates (GST/VAT), tax summary
- [ ] Bank accounts, CSV/OFX import, reconciliation
- [ ] P&L, Balance Sheet, Trial Balance, GL, Cash Flow, AR/AP aging, project profitability
- [ ] Period lock, budgets vs actuals, tests

## Phase 10 — Operations
- [ ] Deal → project handoff, client portal
- [ ] Approvals hub
- [ ] Asset management
- [ ] Announcements & company calendar

## Phase 11 — Dashboards
- [ ] Dashboard builder (grid, widgets, data sources, filters)
- [ ] Prebuilt dashboards (CEO, Sales, Delivery, HR, Finance, My Work)
- [ ] Scheduled report emails, CSV export

## Phase 12 — Admin & hardening
- [ ] Master data screens, custom roles editor
- [ ] Import/export wizard
- [ ] Audit log viewer (filters, export)
- [ ] Integrations, webhooks, REST API + API keys, SMTP / magic-link
- [ ] 2FA, session management, IP allowlist, rate limiting, encryption review
- [ ] Performance + accessibility pass
- [ ] Playwright E2E: convert lead, apply/approve leave, run payroll, reconcile bank, P&L

---

## Decisions log
- **Phase 1**: Reporting line (`managerId`) and department live on `Member`, so RBAC
  `TEAM`/`DEPARTMENT` scopes work for every member (incl. non-employees). The Phase 6
  `Employee` record references `Member` instead of duplicating them.
- **Phase 1**: `createdById` is a plain column (no FK) on business tables.
- **Phase 1**: Tenant routes use `/w/[orgSlug]` (explicit, multi-tab safe) rather than
  an "active org" cookie; the cookie only remembers the last workspace for `/`.
- **Phase 1**: Auth "email" = email + password. Magic links come with SMTP (Phase 12).
- **Phase 1**: Modules not built yet render a "planned for Phase N" landing page via
  `/w/[orgSlug]/[...path]` so navigation is complete from day one.
