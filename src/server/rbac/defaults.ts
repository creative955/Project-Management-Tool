import {
  ACTIONS,
  MODULES,
  type Action,
  type FieldAccessMap,
  type Module,
  type PermissionMap,
  type Scope,
  type SystemRoleKey,
} from "./catalog";

export interface RoleDefinition {
  key: SystemRoleKey;
  name: string;
  description: string;
  isLocked: boolean;
  permissions: PermissionMap;
  fieldAccess: FieldAccessMap;
}

function grant(
  map: PermissionMap,
  modules: readonly Module[],
  actions: readonly Action[],
  scope: Scope,
): PermissionMap {
  for (const m of modules) for (const a of actions) map[`${m}.${a}`] = scope;
  return map;
}

function everything(scope: Scope): PermissionMap {
  return grant({}, MODULES, ACTIONS, scope);
}

const WORK: readonly Action[] = ["view", "create", "edit"];

function build(fn: (p: PermissionMap) => void): PermissionMap {
  const p: PermissionMap = {};
  fn(p);
  return p;
}

/**
 * Default permission matrix for system roles. Custom roles are cloned from these.
 * Anything not listed is NONE.
 */
export const SYSTEM_ROLES: readonly RoleDefinition[] = [
  {
    key: "owner",
    name: "Owner",
    description: "Full access to everything, including billing and ownership transfer.",
    isLocked: true,
    permissions: everything("ALL"),
    fieldAccess: { SALARY: "EDIT", BANK: "EDIT", TAX: "EDIT", PERSONAL: "EDIT" },
  },
  {
    key: "admin",
    name: "Admin",
    description: "Manages the workspace, members and settings across every module.",
    isLocked: false,
    permissions: everything("ALL"),
    fieldAccess: { SALARY: "VIEW", BANK: "MASKED", TAX: "MASKED", PERSONAL: "EDIT" },
  },
  {
    key: "hr_manager",
    name: "HR Manager",
    description: "Owns people data, recruitment, leave, attendance and payroll preparation.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["hr", "leave", "attendance"], ACTIONS, "ALL");
      grant(p, ["payroll"], ["view", "create", "edit", "export"], "ALL");
      grant(p, ["core"], [...WORK, "delete"], "ALL");
      grant(p, ["operations"], [...WORK, "approve"], "ALL");
      grant(p, ["dashboards"], WORK, "ALL");
      grant(p, ["accounting"], ["view", "create"], "OWN");
    }),
    fieldAccess: { SALARY: "EDIT", BANK: "EDIT", TAX: "EDIT", PERSONAL: "EDIT" },
  },
  {
    key: "finance_manager",
    name: "Finance Manager",
    description: "Owns the books, invoicing, payables and payroll approval.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["accounting"], ACTIONS, "ALL");
      grant(p, ["payroll"], ["view", "approve", "export"], "ALL");
      grant(p, ["crm", "hr"], ["view", "export"], "ALL");
      grant(p, ["core"], [...WORK, "delete"], "ALL");
      grant(p, ["operations"], [...WORK, "approve"], "ALL");
      grant(p, ["dashboards"], [...WORK, "export"], "ALL");
      grant(p, ["leave", "attendance"], ["view", "create"], "OWN");
    }),
    fieldAccess: { SALARY: "VIEW", BANK: "VIEW", TAX: "VIEW", PERSONAL: "MASKED" },
  },
  {
    key: "sales_manager",
    name: "Sales Manager",
    description: "Runs the pipeline: leads, accounts, opportunities and quotes.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["crm"], ACTIONS, "ALL");
      grant(p, ["accounting"], ["view", "export"], "ALL");
      grant(p, ["core"], [...WORK, "delete"], "ALL");
      grant(p, ["operations"], [...WORK, "approve"], "ALL");
      grant(p, ["dashboards"], [...WORK, "export"], "ALL");
      grant(p, ["leave", "attendance"], ["view", "approve"], "TEAM");
      grant(p, ["leave", "attendance"], ["create"], "OWN");
      grant(p, ["hr"], ["view"], "TEAM");
    }),
    fieldAccess: { SALARY: "HIDDEN", BANK: "HIDDEN", TAX: "HIDDEN", PERSONAL: "MASKED" },
  },
  {
    key: "project_manager",
    name: "Project Manager",
    description: "Plans and delivers client work; approves team time and leave.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["core"], ACTIONS, "ALL");
      grant(p, ["crm"], ["view"], "ALL");
      grant(p, ["operations"], [...WORK, "approve"], "ALL");
      grant(p, ["dashboards"], [...WORK, "export"], "ALL");
      grant(p, ["leave", "attendance"], ["view", "approve"], "TEAM");
      grant(p, ["leave", "attendance"], ["create"], "OWN");
      grant(p, ["hr"], ["view"], "TEAM");
      grant(p, ["accounting"], ["view", "create"], "OWN");
    }),
    fieldAccess: { SALARY: "HIDDEN", BANK: "HIDDEN", TAX: "HIDDEN", PERSONAL: "MASKED" },
  },
  {
    key: "team_lead",
    name: "Team Lead",
    description: "Leads a craft team; approves their leave and timesheets.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["core"], WORK, "ALL");
      grant(p, ["core"], ["delete"], "TEAM");
      grant(p, ["operations"], ["view"], "ALL");
      grant(p, ["dashboards"], WORK, "OWN");
      grant(p, ["leave", "attendance"], ["view", "approve"], "TEAM");
      grant(p, ["leave", "attendance"], ["create"], "OWN");
      grant(p, ["hr"], ["view"], "TEAM");
      grant(p, ["payroll"], ["view"], "OWN");
      grant(p, ["accounting"], ["view", "create"], "OWN");
    }),
    fieldAccess: { SALARY: "HIDDEN", BANK: "HIDDEN", TAX: "HIDDEN", PERSONAL: "MASKED" },
  },
  {
    key: "employee",
    name: "Employee",
    description: "Works on tasks and uses self-service for leave, payslips and expenses.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["core"], WORK, "ALL");
      grant(p, ["core"], ["delete"], "OWN");
      grant(p, ["operations"], ["view"], "ALL");
      grant(p, ["dashboards"], WORK, "OWN");
      grant(p, ["hr"], ["view", "edit"], "OWN");
      grant(p, ["leave", "attendance"], WORK, "OWN");
      grant(p, ["payroll"], ["view"], "OWN");
      grant(p, ["accounting"], ["view", "create"], "OWN");
    }),
    fieldAccess: { SALARY: "HIDDEN", BANK: "HIDDEN", TAX: "HIDDEN", PERSONAL: "HIDDEN" },
  },
  {
    key: "guest",
    name: "Guest / Client",
    description: "External collaborator. Sees only items explicitly shared with them.",
    isLocked: false,
    permissions: build((p) => {
      grant(p, ["core"], ["view"], "OWN");
      grant(p, ["operations"], ["view"], "OWN");
    }),
    fieldAccess: { SALARY: "HIDDEN", BANK: "HIDDEN", TAX: "HIDDEN", PERSONAL: "HIDDEN" },
  },
];

export function systemRole(key: SystemRoleKey): RoleDefinition {
  const role = SYSTEM_ROLES.find((r) => r.key === key);
  if (!role) throw new Error(`Unknown system role ${key}`);
  return role;
}
