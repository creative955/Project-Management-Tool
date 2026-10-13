export const MODULES = [
  "core",
  "crm",
  "hr",
  "leave",
  "attendance",
  "payroll",
  "accounting",
  "operations",
  "dashboards",
  "admin",
] as const;
export type Module = (typeof MODULES)[number];

export const ACTIONS = ["view", "create", "edit", "delete", "approve", "export"] as const;
export type Action = (typeof ACTIONS)[number];

/** Ordered from least to most permissive. */
export const SCOPES = ["NONE", "OWN", "TEAM", "DEPARTMENT", "ALL"] as const;
export type Scope = (typeof SCOPES)[number];

export const FIELD_GROUPS = ["SALARY", "BANK", "TAX", "PERSONAL"] as const;
export type FieldGroup = (typeof FIELD_GROUPS)[number];

/** Ordered from least to most permissive. */
export const FIELD_ACCESS_LEVELS = ["HIDDEN", "MASKED", "VIEW", "EDIT"] as const;
export type FieldAccess = (typeof FIELD_ACCESS_LEVELS)[number];

export const MODULE_LABELS: Record<Module, string> = {
  core: "Projects & Work",
  crm: "CRM",
  hr: "People (HR)",
  leave: "Leave",
  attendance: "Attendance",
  payroll: "Payroll",
  accounting: "Accounting",
  operations: "Operations",
  dashboards: "Dashboards",
  admin: "Admin & Settings",
};

export const SCOPE_LABELS: Record<Scope, string> = {
  NONE: "None",
  OWN: "Own",
  TEAM: "Team",
  DEPARTMENT: "Department",
  ALL: "All",
};

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  SALARY: "Salary & compensation",
  BANK: "Bank details",
  TAX: "Tax identifiers",
  PERSONAL: "Personal information",
};

export const SYSTEM_ROLE_KEYS = [
  "owner",
  "admin",
  "hr_manager",
  "finance_manager",
  "sales_manager",
  "project_manager",
  "team_lead",
  "employee",
  "guest",
] as const;
export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[number];

export type PermissionKey = `${Module}.${Action}`;
export type PermissionMap = Partial<Record<PermissionKey, Scope>>;
export type FieldAccessMap = Partial<Record<FieldGroup, FieldAccess>>;
