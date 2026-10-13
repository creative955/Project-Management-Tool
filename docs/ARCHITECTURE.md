# OpsHub — Architecture

> The product name lives in a single constant: `APP_NAME` in `src/config/app.ts`.
> Re-read this document and `docs/PROGRESS.md` at the start of every phase.

OpsHub is a multi-tenant work-management platform (ClickUp-style hierarchy, views and
automations) combined with a business suite: CRM, HRMS (employees, recruitment, leave,
attendance, payroll), double-entry Accounting, Operations, Dashboards and Admin.

---

## 1. Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript `strict` | RSC by default; client components only for interactivity |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix, "new-york") + lucide-react | Tokens are CSS variables in `src/app/globals.css` |
| Database | PostgreSQL 16 + Prisma 6 | `prisma/schema.prisma`, migrations in `prisma/migrations` |
| Auth | Auth.js v5 (`next-auth@beta`) + Prisma adapter | Database sessions (revocable). Email + password and Google SSO |
| Mutations | Server Actions + Zod 4 | All go through `orgAction()` (auth → tenant → RBAC → validate → transaction → audit) |
| Client data | TanStack Query 5 | Server state from Server Actions / route handlers |
| Grids | TanStack Table + TanStack Virtual (Phase 2+) | Virtualised for 10k+ rows |
| DnD | dnd-kit (Phase 2+) | Boards, reordering, sidebar tree |
| Charts | Recharts (Phase 5+) | |
| Calendar / Gantt | FullCalendar / custom SVG Gantt (Phase 3) | |
| Rich text | TipTap (Phase 3) | Docs and task descriptions |
| Files | S3-compatible storage (Phase 3) | Pre-signed uploads; `Attachment` is polymorphic |
| Jobs | pg-boss (Phase 4+) | Automations, accruals, payroll runs, email |
| PDF | @react-pdf/renderer (Phase 5+) | Payslips, invoices, offer letters, statements |
| Tests | Vitest (unit + DB integration), Playwright (Phase 12) | |

### Money

* Money is **always** an integer number of minor units (`BigInt` in Postgres/Prisma,
  `bigint` in TypeScript) plus an ISO-4217 currency code. Floats are never used for money.
* Minor-unit exponents come from `src/lib/money.ts` (e.g. INR/USD/GBP/AUD = 2,
  AED/SAR/QAR = 2, KWD/BHD/OMR = 3, JPY = 0).
* Conversions (FX, percentages, tax) use integer/bigint arithmetic with explicit,
  tested rounding (`half-up` by default, `half-even` available). Allocation helpers
  distribute remainders so splits always sum to the original amount.
* Exchange rates are stored as decimal strings / `Decimal(18,8)` and applied via
  scaled-integer maths, never `Number` multiplication.
* `bigint` is not JSON-serialisable; values crossing the server→client boundary are
  serialised to strings with `serializeMoney()` and parsed back with `parseMoney()`.

---

## 2. Folder structure

```
docs/                      ARCHITECTURE.md, PROGRESS.md
prisma/
  schema.prisma            Single schema, grouped by module with banner comments
  migrations/              Prisma Migrate history
  seed/                    Seed entrypoint + realistic demo data (20-person agency)
src/
  app/
    (auth)/                login, signup (public)
    invite/[token]/        accept an organisation invitation
    onboarding/            create first workspace
    w/[orgSlug]/           Tenant-scoped app (shell layout)
      home/ inbox/ everything/
      settings/            general, members, roles, audit
      [...path]/           Module landing pages for modules not yet built
    api/auth/[...nextauth] Auth.js route handler
  components/
    ui/                    shadcn/ui primitives (generated, lightly edited)
    shell/                 Sidebar, top bar, command palette, views bar, etc.
    common/                Empty/error/loading states, page header, etc.
  config/                  app.ts (APP_NAME etc.), navigation.ts (module nav + phases)
  hooks/                   Client hooks (hotkeys, density, ...)
  lib/                     Pure, framework-free utilities (money, slug, dates). Unit-tested.
  server/                  Server-only code ("server-only" import)
    db.ts                  Prisma client singleton
    auth/                  Auth.js config, password hashing
    tenancy/               Org context resolution + tenant-scoped Prisma client
    rbac/                  Permission catalog, default role matrix, checks
    audit/                 Audit writer + diff
    actions/               orgAction() wrapper and ActionResult type
    modules/<module>/      Per-module services, queries and actions
tests/integration/         Vitest tests that hit a real Postgres (opshub_test)
```

Rules:

* `src/lib` must stay pure (no Prisma, no Next) so calculations are trivially unit-testable.
  Payroll, leave and accounting engines live in `src/lib/<domain>/` as pure functions;
  `src/server/modules/<domain>/` loads data, calls the engine, and persists results.
* Pages are Server Components that call `getOrgContext()` and module queries; client
  components receive serialisable props.

---

## 3. Multi-tenancy

* **Organization** = Workspace = tenant. Users can belong to many organisations through
  **Member** rows.
* Tenant routes live under `/w/[orgSlug]/…`. The slug is resolved to an org and the
  current user's membership on every request by `getOrgContext(orgSlug)` (memoised per
  request with React `cache`). Non-members get a 404 (no tenant enumeration).
* Every business table has: `orgId`, `createdAt`, `updatedAt`, `createdById`, `deletedAt`.
  * `createdById` is a plain `String?` (user id) without an FK, to avoid hundreds of
    back-relations on `User`; it is always written by the server from the session.
  * `deletedAt` implements soft delete.
* `tenantDb(orgId)` returns a Prisma client extension that, for every model that has an
  `orgId` column (discovered from Prisma DMMF, so new models are covered automatically):
  * injects `orgId` into `where` for reads, updates, deletes, counts and aggregates;
  * injects `orgId` into `data` for creates/upserts;
  * adds `deletedAt: null` to reads unless the caller filters on `deletedAt` explicitly.
  Module code must use `ctx.db` (tenant client), never the raw client, except for
  cross-tenant system work (auth, seed, jobs) which is explicit.
* Exempt tables: Auth.js tables (`User`, `Account`, `Session`, `VerificationToken`),
  `Organization` itself, and `AuditLog` (append-only: it has `orgId`/`createdAt` but no
  `updatedAt`/`deletedAt`, by design).

---

## 4. Permission model (RBAC + record scope + field groups)

### 4.1 Roles

System roles are created for every organisation from `src/server/rbac/defaults.ts`:
Owner, Admin, HR Manager, Finance Manager, Sales Manager, Project Manager, Team Lead,
Employee, Guest/Client. Custom roles can be cloned from them (Phase 12). Owner is locked.

### 4.2 Module permissions

`Permission(roleId, module, action, scope)`

* **module**: `core | crm | hr | leave | attendance | payroll | accounting | operations | dashboards | admin`
* **action**: `view | create | edit | delete | approve | export`
* **scope**: `NONE < OWN < TEAM < DEPARTMENT < ALL`
  * `OWN` — records the actor owns / is assigned to / is the subject of.
  * `TEAM` — `OWN` plus records of everyone who reports to the actor, directly or
    transitively (reporting line = `Member.managerId`).
  * `DEPARTMENT` — `OWN` plus records belonging to the actor's department.
  * `ALL` — every record in the organisation.

`requirePermission(ctx, module, action)` throws `ForbiddenError` when the scope is `NONE`
and returns the scope; `scopeAllows(scope, actor, record)` performs the record-level
check. Later phases add `scopeWhere()` to translate a scope into a Prisma `where`.

### 4.3 Field-level access

Sensitive data is grouped: `SALARY`, `BANK`, `TAX`, `PERSONAL`.
`RoleFieldAccess(roleId, fieldGroup, access)` with access `HIDDEN | MASKED | VIEW | EDIT`.
A member always has at least `VIEW` on their **own** record. Bank and tax identifiers are
encrypted at rest (AES-256-GCM, key from `ENCRYPTION_KEY`, Phase 6) and masked in the UI
unless the access level is `VIEW`/`EDIT`.

### 4.4 Object-level (Core work engine, Phase 2)

Spaces/Folders/Lists/Docs add their own membership + permission (`FULL | EDIT | COMMENT | VIEW`)
on top of the module permission; the effective right is the minimum of both.

### 4.5 Enforcement

Every mutation is a Server Action created with `orgAction({ schema, permission, audit })`:

1. Resolve session → 401 if missing.
2. Resolve org + membership from `orgSlug` → 404 if not a member / suspended.
3. Check `permission` → 403 `ForbiddenError`.
4. Validate input with Zod → field errors.
5. Run the handler inside a Prisma transaction with a tenant-scoped client.
6. Write an `AuditLog` row (actor, action, entity, before/after diff) in the same transaction.

Returns `ActionResult<T> = { ok: true, data } | { ok: false, error, fieldErrors? }`.

---

## 5. Auth

* Auth.js v5 with the Prisma adapter and **database sessions** (`Session` table), so
  sessions can be listed and revoked (Phase 12).
* Providers: **Credentials** (email + bcrypt password) and **Google** (enabled in the UI
  when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set). Credentials sign-in creates a DB
  session row via a custom `jwt.encode` so both providers share one session model.
* Middleware only checks for the presence of the session cookie (Edge-safe) and redirects
  to `/login`; authoritative checks happen in `getOrgContext()` / `orgAction()`.
* Magic-link email sign-in arrives with SMTP integration (Phase 12).

---

## 6. Data model overview

Shared conventions: `id String @id @default(cuid())`, base fields above, money as
`BigInt` minor units + `currency`. Polymorphic links use `entityType` + `entityId` for
`Comment`, `Attachment`, `Activity`, `CustomFieldValue`, `AuditLog`, `Notification`.

| Module | Models | Phase |
| --- | --- | --- |
| Platform | User, Account, Session, VerificationToken, Organization, Member, Role, Permission, RoleFieldAccess, Invitation, Location, Department, Designation, Grade, AuditLog | 1 |
| Core | Space, SpaceMember, Folder, List, Task, TaskAssignee, TaskWatcher, TaskDependency, Checklist, ChecklistItem, StatusSet, Status, CustomFieldDef, CustomFieldValue, TaskType, Tag, View | 2 |
| Core | TimeEntry, Timesheet, Doc, DocPage, Form, FormSubmission, Comment, Mention, Attachment, Notification | 3 |
| Core | Automation, AutomationRun, Template, Goal, GoalTarget, Sprint | 4 |
| CRM | Lead, LeadStatus, LeadSource, Campaign, ScoringRule, AssignmentRule, Account, Contact, Pipeline, Stage, Opportunity, Activity, Product, Quote, QuoteLine | 5 |
| HR | Employee, EmployeeDocument, EmployeeHistory, Asset (shared w/ Ops), JobRequisition, JobPosting, Candidate, CandidateStage, Interview, Scorecard, Offer, OnboardingTemplate | 6 |
| Leave & Attendance | LeaveType, LeavePolicy, LeavePolicyAssignment, HolidayCalendar, Holiday, LeaveRequest, LeaveApproval, LeaveTransaction, CompOff, Shift, AttendanceRecord, RegularisationRequest | 7 |
| Payroll | StatutoryConfig, SalaryTemplate, SalaryComponent, EmployeeSalary, PayrollRun, Payslip, PayslipLine, Loan, LoanInstallment, Reimbursement | 8 |
| Accounting | LedgerAccount, JournalEntry, JournalLine, Customer, Vendor, Invoice, InvoiceLine, CreditNote, Bill, BillLine, Payment, PaymentAllocation, Expense, TaxRate, ExchangeRate, BankAccount, BankStatementImport, BankStatementLine, Reconciliation, Budget, BudgetLine, PeriodLock | 9 |
| Operations | ClientPortalAccess, ApprovalRequest, Asset, AssetAssignment, Announcement, CompanyEvent | 10 |
| Dashboards | Dashboard, Widget, ScheduledReport | 11 |
| Admin | ApiKey, Webhook, Integration, ImportJob, MasterData screens | 12 |

Key invariants (enforced in code and DB):

* **Journal balancing**: `JournalEntry` is posted only if Σdebit = Σcredit (per entry, in
  base currency); enforced in the posting service inside a transaction plus a deferred
  constraint trigger. Posted entries are immutable; corrections are reversal entries.
* **Leave ledger**: balances are never stored as mutable numbers; every accrual,
  deduction, adjustment, lapse and encashment is a `LeaveTransaction`; balance = Σ.
* **Period lock**: no posting dated on/before the org's lock date.
* **Payroll**: a locked run is immutable; payslips snapshot every input used.

---

## 7. UI / design system

* Brand tokens (CSS variables in `globals.css`, light + dark):
  base `#F7F8F5`, ink `#0B0B0B`, accent `#B6FF3B`.
  * Primary actions and active nav items: green background with **black** text.
  * Green is never used as text on light surfaces (fails contrast). In dark mode green
    text on `#0B0B0B` is allowed (≈16:1).
  * Focus: green 3px ring **plus** a 2px ink outline in light mode (green alone is
    ~1.1:1 against the base and would fail WCAG 1.4.11 non-text contrast).
* Density: `data-density="comfortable|compact"` on `<html>` (cookie-persisted, SSR-safe).
  Compact lowers the root font-size, so every rem-based spacing tightens together.
* Shell: collapsible sidebar (cookie-persisted; drawer on mobile), top bar with
  Cmd+K search, quick-create, timer, notifications, profile; page header + Views Bar.
* Keyboard shortcuts are declared once in `src/config/shortcuts.ts` and shown in the
  `?` help dialog.
* Every screen ships loading (skeleton), empty (with CTA) and error states.
