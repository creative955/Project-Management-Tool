import type { Organization, Prisma, Role } from "@prisma/client";
import { writeAudit } from "@/server/audit/write";
import type { SystemRoleKey } from "@/server/rbac/catalog";
import { SYSTEM_ROLES } from "@/server/rbac/defaults";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerUserId: string;
  country: string;
  baseCurrency: string;
  timezone: string;
  fiscalYearStartMonth: number;
}

export interface CreatedOrganization {
  org: Organization;
  roles: Record<SystemRoleKey, Role>;
  ownerMemberId: string;
}

/** Creates the default system roles (with permissions and field access) for an org. */
export async function createSystemRoles(
  tx: Prisma.TransactionClient,
  orgId: string,
  createdById: string | null,
): Promise<Record<SystemRoleKey, Role>> {
  const roles = {} as Record<SystemRoleKey, Role>;
  for (const [index, def] of SYSTEM_ROLES.entries()) {
    const role = await tx.role.create({
      data: {
        orgId,
        key: def.key,
        name: def.name,
        description: def.description,
        isSystem: true,
        isLocked: def.isLocked,
        sortOrder: index,
        createdById,
      },
    });
    const permissions = Object.entries(def.permissions)
      .filter(([, scope]) => scope && scope !== "NONE")
      .map(([key, scope]) => {
        const [module, action] = key.split(".");
        return { orgId, roleId: role.id, module, action, scope: scope!, createdById };
      });
    if (permissions.length > 0) await tx.permission.createMany({ data: permissions });
    const fieldAccess = Object.entries(def.fieldAccess).map(([fieldGroup, access]) => ({
      orgId,
      roleId: role.id,
      fieldGroup: fieldGroup as keyof typeof def.fieldAccess,
      access: access!,
      createdById,
    }));
    if (fieldAccess.length > 0) await tx.roleFieldAccess.createMany({ data: fieldAccess });
    roles[def.key] = role;
  }
  return roles;
}

/** Creates an organisation, its system roles and the owner membership, in `tx`. */
export async function createOrganization(
  tx: Prisma.TransactionClient,
  input: CreateOrganizationInput,
): Promise<CreatedOrganization> {
  const org = await tx.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      country: input.country,
      baseCurrency: input.baseCurrency,
      timezone: input.timezone,
      fiscalYearStartMonth: input.fiscalYearStartMonth,
      createdById: input.ownerUserId,
    },
  });
  const roles = await createSystemRoles(tx, org.id, input.ownerUserId);
  const owner = await tx.member.create({
    data: {
      orgId: org.id,
      userId: input.ownerUserId,
      roleId: roles.owner.id,
      createdById: input.ownerUserId,
    },
  });
  await writeAudit(
    tx,
    { orgId: org.id, actorId: input.ownerUserId },
    {
      action: "organization.created",
      entityType: "Organization",
      entityId: org.id,
      after: {
        name: org.name,
        slug: org.slug,
        baseCurrency: org.baseCurrency,
        country: org.country,
        timezone: org.timezone,
      },
    },
  );
  return { org, roles, ownerMemberId: owner.id };
}
