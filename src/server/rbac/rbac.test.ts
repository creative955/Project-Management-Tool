import { describe, expect, it } from "vitest";
import { ACTIONS, FIELD_GROUPS, MODULES, SCOPES, SYSTEM_ROLE_KEYS, type PermissionMap } from "./catalog";
import {
  can,
  canOnRecord,
  collectReports,
  fieldAccessFor,
  ForbiddenError,
  getScope,
  maskValue,
  maxScope,
  requireScope,
  scopeAllows,
  type Actor,
} from "./check";
import { SYSTEM_ROLES, systemRole } from "./defaults";

function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    memberId: "m-self",
    departmentId: "d-design",
    reportIds: ["m-report-1", "m-report-2"],
    permissions: {},
    fieldAccess: {},
    ...overrides,
  };
}

describe("default role matrix", () => {
  it("defines exactly the nine system roles", () => {
    expect(SYSTEM_ROLES.map((r) => r.key)).toEqual([...SYSTEM_ROLE_KEYS]);
  });

  it("only uses known modules, actions and scopes", () => {
    for (const role of SYSTEM_ROLES) {
      for (const [key, scope] of Object.entries(role.permissions)) {
        const [module, action] = key.split(".");
        expect(MODULES).toContain(module);
        expect(ACTIONS).toContain(action);
        expect(SCOPES).toContain(scope);
      }
      for (const group of FIELD_GROUPS) expect(role.fieldAccess[group]).toBeDefined();
    }
  });

  it("gives the owner everything", () => {
    const owner = systemRole("owner");
    for (const m of MODULES) for (const a of ACTIONS) expect(getScope(owner.permissions, m, a)).toBe("ALL");
    expect(owner.isLocked).toBe(true);
    for (const g of FIELD_GROUPS) expect(owner.fieldAccess[g]).toBe("EDIT");
  });

  it("keeps admin settings away from non-admin roles", () => {
    for (const role of SYSTEM_ROLES.filter((r) => r.key !== "owner" && r.key !== "admin")) {
      for (const a of ACTIONS) expect(getScope(role.permissions, "admin", a)).toBe("NONE");
    }
  });

  it("limits employees to self-service on HR, leave and payroll", () => {
    const e = systemRole("employee").permissions;
    expect(getScope(e, "hr", "view")).toBe("OWN");
    expect(getScope(e, "leave", "create")).toBe("OWN");
    expect(getScope(e, "payroll", "view")).toBe("OWN");
    expect(getScope(e, "leave", "approve")).toBe("NONE");
    expect(getScope(e, "crm", "view")).toBe("NONE");
    expect(getScope(e, "accounting", "approve")).toBe("NONE");
  });

  it("lets team leads approve leave only for their team", () => {
    expect(getScope(systemRole("team_lead").permissions, "leave", "approve")).toBe("TEAM");
  });

  it("separates payroll preparation (HR) from approval (Finance)", () => {
    expect(getScope(systemRole("hr_manager").permissions, "payroll", "approve")).toBe("NONE");
    expect(getScope(systemRole("finance_manager").permissions, "payroll", "approve")).toBe("ALL");
  });

  it("hides sensitive fields from roles that do not need them", () => {
    for (const key of ["sales_manager", "project_manager", "team_lead", "employee", "guest"] as const) {
      const r = systemRole(key);
      expect(r.fieldAccess.SALARY).toBe("HIDDEN");
      expect(r.fieldAccess.BANK).toBe("HIDDEN");
      expect(r.fieldAccess.TAX).toBe("HIDDEN");
    }
  });

  it("restricts guests to items shared with them", () => {
    const g = systemRole("guest").permissions;
    expect(Object.entries(g).every(([, scope]) => scope === "OWN")).toBe(true);
    expect(can({ permissions: g }, "core", "create")).toBe(false);
  });
});

describe("permission checks", () => {
  const permissions: PermissionMap = { "crm.view": "TEAM", "crm.edit": "OWN" };

  it("returns NONE for anything not granted", () => {
    expect(getScope(permissions, "crm", "delete")).toBe("NONE");
    expect(can({ permissions }, "crm", "view")).toBe(true);
    expect(can({ permissions }, "hr", "view")).toBe(false);
  });

  it("requireScope throws ForbiddenError when not granted", () => {
    expect(requireScope({ permissions }, "crm", "view")).toBe("TEAM");
    expect(() => requireScope({ permissions }, "crm", "delete")).toThrow(ForbiddenError);
  });

  it("orders scopes", () => {
    expect(maxScope("OWN", "TEAM")).toBe("TEAM");
    expect(maxScope("ALL", "NONE")).toBe("ALL");
  });
});

describe("record scope", () => {
  const a = actor();

  it("NONE never allows", () => {
    expect(scopeAllows("NONE", a, { memberIds: ["m-self"] })).toBe(false);
  });

  it("OWN allows only records the actor owns", () => {
    expect(scopeAllows("OWN", a, { memberIds: ["m-self"] })).toBe(true);
    expect(scopeAllows("OWN", a, { memberIds: ["m-other", "m-self"] })).toBe(true);
    expect(scopeAllows("OWN", a, { memberIds: ["m-report-1"] })).toBe(false);
    expect(scopeAllows("OWN", a, { memberIds: [null, undefined] })).toBe(false);
  });

  it("TEAM adds direct and indirect reports", () => {
    expect(scopeAllows("TEAM", a, { memberIds: ["m-report-2"] })).toBe(true);
    expect(scopeAllows("TEAM", a, { memberIds: ["m-stranger"] })).toBe(false);
  });

  it("DEPARTMENT matches the actor's department", () => {
    expect(scopeAllows("DEPARTMENT", a, { memberIds: ["m-x"], departmentId: "d-design" })).toBe(true);
    expect(scopeAllows("DEPARTMENT", a, { memberIds: ["m-x"], departmentId: "d-tech" })).toBe(false);
    expect(scopeAllows("DEPARTMENT", a, { memberIds: ["m-x"] })).toBe(false);
    const noDept = actor({ departmentId: null });
    expect(scopeAllows("DEPARTMENT", noDept, { memberIds: ["m-x"], departmentId: null })).toBe(false);
  });

  it("ALL allows everything", () => {
    expect(scopeAllows("ALL", a, { memberIds: [] })).toBe(true);
  });

  it("canOnRecord combines module permission and record scope", () => {
    const lead = actor({ permissions: { "leave.approve": "TEAM" } });
    expect(canOnRecord(lead, "leave", "approve", { memberIds: ["m-report-1"] })).toBe(true);
    expect(canOnRecord(lead, "leave", "approve", { memberIds: ["m-stranger"] })).toBe(false);
    expect(canOnRecord(lead, "leave", "view", { memberIds: ["m-self"] })).toBe(false);
  });
});

describe("collectReports", () => {
  const members = [
    { id: "ceo", managerId: null },
    { id: "coo", managerId: "ceo" },
    { id: "hr", managerId: "coo" },
    { id: "hr-exec", managerId: "hr" },
    { id: "cd", managerId: "ceo" },
    { id: "designer", managerId: "cd" },
  ];

  it("returns direct and transitive reports", () => {
    expect(collectReports(members, "coo").sort()).toEqual(["hr", "hr-exec"]);
    expect(collectReports(members, "ceo")).toHaveLength(5);
    expect(collectReports(members, "designer")).toEqual([]);
  });

  it("terminates on reporting cycles and never includes the manager", () => {
    const cyclic = [
      { id: "a", managerId: "c" },
      { id: "b", managerId: "a" },
      { id: "c", managerId: "b" },
    ];
    expect(collectReports(cyclic, "a").sort()).toEqual(["b", "c"]);
  });
});

describe("field access", () => {
  it("uses the role's grant for other people's records", () => {
    const a = actor({ fieldAccess: { SALARY: "MASKED" } });
    expect(fieldAccessFor(a, "SALARY", "m-other")).toBe("MASKED");
    expect(fieldAccessFor(a, "BANK", "m-other")).toBe("HIDDEN");
  });

  it("always grants at least VIEW on one's own record", () => {
    const a = actor({ fieldAccess: { SALARY: "HIDDEN", BANK: "EDIT" } });
    expect(fieldAccessFor(a, "SALARY", "m-self")).toBe("VIEW");
    expect(fieldAccessFor(a, "BANK", "m-self")).toBe("EDIT");
  });

  it("masks values keeping the last digits", () => {
    expect(maskValue("123456789012")).toBe("••••••••9012");
    expect(maskValue("12")).toBe("••••12");
    expect(maskValue(null)).toBe("");
  });
});
