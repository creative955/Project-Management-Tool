import { describe, expect, it } from "vitest";
import { scopeArgs, SOFT_DELETE_MODELS, TENANT_MODELS, TenantViolationError } from "./tenant-db";

const ORG = "org_a";

describe("tenant model discovery", () => {
  it("covers every model with an orgId and nothing else", () => {
    for (const m of ["Member", "Role", "Permission", "RoleFieldAccess", "Invitation", "Location", "Department", "Designation", "Grade", "AuditLog"]) {
      expect(TENANT_MODELS.has(m)).toBe(true);
    }
    for (const m of ["User", "Account", "Session", "VerificationToken", "Organization"]) {
      expect(TENANT_MODELS.has(m)).toBe(false);
    }
  });

  it("treats AuditLog as append-only (no soft delete)", () => {
    expect(SOFT_DELETE_MODELS.has("AuditLog")).toBe(false);
    expect(SOFT_DELETE_MODELS.has("Member")).toBe(true);
  });
});

describe("scopeArgs", () => {
  it("adds orgId and the soft-delete filter to reads", () => {
    expect(scopeArgs("Member", "findMany", { where: { status: "ACTIVE" } }, ORG)).toEqual({
      where: { status: "ACTIVE", orgId: ORG, deletedAt: null },
    });
    expect(scopeArgs("Member", "count", undefined, ORG)).toEqual({ where: { orgId: ORG, deletedAt: null } });
    expect(scopeArgs("Role", "findUnique", { where: { id: "r1" } }, ORG)).toEqual({
      where: { id: "r1", orgId: ORG, deletedAt: null },
    });
  });

  it("overrides any orgId the caller passed in a filter", () => {
    expect(scopeArgs("Member", "findFirst", { where: { orgId: "org_b" } }, ORG).where).toMatchObject({ orgId: ORG });
    expect(scopeArgs("Member", "deleteMany", { where: { orgId: "org_b" } }, ORG).where).toEqual({ orgId: ORG });
  });

  it("respects an explicit deletedAt filter", () => {
    expect(scopeArgs("Member", "findMany", { where: { deletedAt: { not: null } } }, ORG).where).toEqual({
      deletedAt: { not: null },
      orgId: ORG,
    });
  });

  it("does not add a soft-delete filter for append-only models", () => {
    expect(scopeArgs("AuditLog", "findMany", {}, ORG)).toEqual({ where: { orgId: ORG } });
  });

  it("scopes updates and deletes by orgId", () => {
    expect(scopeArgs("Member", "update", { where: { id: "m1" }, data: { title: "x" } }, ORG)).toEqual({
      where: { id: "m1", orgId: ORG },
      data: { title: "x" },
    });
    expect(scopeArgs("Member", "updateMany", { where: {}, data: {} }, ORG).where).toEqual({ orgId: ORG });
  });

  it("injects orgId into creates", () => {
    expect(scopeArgs("Location", "create", { data: { name: "x" } }, ORG)).toEqual({ data: { name: "x", orgId: ORG } });
    expect(scopeArgs("Location", "createMany", { data: [{ name: "a" }, { name: "b" }] }, ORG)).toEqual({
      data: [
        { name: "a", orgId: ORG },
        { name: "b", orgId: ORG },
      ],
    });
    expect(scopeArgs("Location", "upsert", { where: { id: "l" }, create: { name: "c" }, update: {} }, ORG)).toEqual({
      where: { id: "l", orgId: ORG },
      create: { name: "c", orgId: ORG },
      update: {},
    });
  });

  it("refuses to create rows for another organisation", () => {
    expect(() => scopeArgs("Location", "create", { data: { orgId: "org_b" } }, ORG)).toThrow(TenantViolationError);
    expect(() => scopeArgs("Location", "createMany", { data: [{ orgId: ORG }, { orgId: "org_b" }] }, ORG)).toThrow(
      TenantViolationError,
    );
  });

  it("leaves non-tenant models untouched", () => {
    const args = { where: { email: "a@b.c" } };
    expect(scopeArgs("User", "findUnique", args, ORG)).toEqual(args);
  });
});
