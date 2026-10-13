import type { FieldAccess as DbFieldAccess, Organization, PermissionScope } from "@prisma/client";
import { prisma } from "@/server/db";
import {
  ACTIONS,
  MODULES,
  type Action,
  type FieldAccessMap,
  type FieldGroup,
  type Module,
  type PermissionMap,
} from "@/server/rbac/catalog";
import { collectReports, type Actor } from "@/server/rbac/check";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface OrgMembership {
  org: Organization;
  member: {
    id: string;
    title: string | null;
    departmentId: string | null;
    managerId: string | null;
  };
  role: { id: string; key: string; name: string };
  actor: Actor;
}

const MODULE_SET = new Set<string>(MODULES);
const ACTION_SET = new Set<string>(ACTIONS);

export function toPermissionMap(
  rows: readonly { module: string; action: string; scope: PermissionScope }[],
): PermissionMap {
  const map: PermissionMap = {};
  for (const row of rows) {
    if (!MODULE_SET.has(row.module) || !ACTION_SET.has(row.action)) continue;
    map[`${row.module as Module}.${row.action as Action}`] = row.scope;
  }
  return map;
}

export function toFieldAccessMap(
  rows: readonly { fieldGroup: FieldGroup; access: DbFieldAccess }[],
): FieldAccessMap {
  const map: FieldAccessMap = {};
  for (const row of rows) map[row.fieldGroup] = row.access;
  return map;
}

/**
 * Loads the user's active membership in the org identified by `orgSlug`, or null
 * when the org does not exist, is deleted, or the user is not an active member.
 */
export async function resolveMembership(userId: string, orgSlug: string): Promise<OrgMembership | null> {
  const member = await prisma.member.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
      org: { slug: orgSlug, deletedAt: null },
    },
    include: {
      org: true,
      role: {
        include: {
          permissions: { where: { deletedAt: null } },
          fieldAccess: { where: { deletedAt: null } },
        },
      },
    },
  });
  if (!member || member.role.deletedAt) return null;

  const reportingLines = await prisma.member.findMany({
    where: { orgId: member.orgId, deletedAt: null },
    select: { id: true, managerId: true },
  });

  const actor: Actor = {
    memberId: member.id,
    departmentId: member.departmentId,
    reportIds: collectReports(reportingLines, member.id),
    permissions: toPermissionMap(member.role.permissions),
    fieldAccess: toFieldAccessMap(member.role.fieldAccess),
  };

  return {
    org: member.org,
    member: {
      id: member.id,
      title: member.title,
      departmentId: member.departmentId,
      managerId: member.managerId,
    },
    role: { id: member.role.id, key: member.role.key, name: member.role.name },
    actor,
  };
}

export async function listUserWorkspaces(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId, status: "ACTIVE", deletedAt: null, org: { deletedAt: null } },
    select: {
      org: { select: { id: true, name: true, slug: true, logoUrl: true } },
      role: { select: { name: true } },
    },
    orderBy: { org: { name: "asc" } },
  });
  return memberships.map((m) => ({ ...m.org, roleName: m.role.name }));
}
