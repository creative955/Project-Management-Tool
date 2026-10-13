import "server-only";
import type { OrgContext } from "@/server/tenancy/context";

export async function getHomeData(ctx: OrgContext) {
  const [memberCount, departmentCount, locationCount, pendingInvites, reports, departmentPeers] = await Promise.all([
    ctx.db.member.count({ where: { status: "ACTIVE" } }),
    ctx.db.department.count(),
    ctx.db.location.count(),
    ctx.db.invitation.count({ where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } }),
    ctx.db.member.findMany({
      where: { managerId: ctx.member.id, status: "ACTIVE" },
      select: { id: true, title: true, user: { select: { name: true, email: true, image: true } } },
      orderBy: { user: { name: "asc" } },
      take: 12,
    }),
    ctx.member.departmentId
      ? ctx.db.member.findMany({
          where: { departmentId: ctx.member.departmentId, status: "ACTIVE", id: { not: ctx.member.id } },
          select: { id: true, title: true, user: { select: { name: true, email: true, image: true } } },
          orderBy: { user: { name: "asc" } },
          take: 12,
        })
      : Promise.resolve([]),
  ]);
  const department = ctx.member.departmentId
    ? await ctx.db.department.findFirst({ where: { id: ctx.member.departmentId }, select: { name: true } })
    : null;
  const manager = ctx.member.managerId
    ? await ctx.db.member.findFirst({
        where: { id: ctx.member.managerId },
        select: { title: true, user: { select: { name: true, email: true, image: true } } },
      })
    : null;

  return { memberCount, departmentCount, locationCount, pendingInvites, reports, departmentPeers, department, manager };
}

export async function getMembersPageData(ctx: OrgContext) {
  const [members, roles, invitations] = await Promise.all([
    ctx.db.member.findMany({
      select: {
        id: true,
        status: true,
        title: true,
        joinedAt: true,
        role: { select: { id: true, name: true, key: true } },
        user: { select: { name: true, email: true, image: true } },
        department: { select: { name: true } },
        location: { select: { name: true } },
        manager: { select: { user: { select: { name: true } } } },
      },
      orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
    }),
    ctx.db.role.findMany({ select: { id: true, name: true, key: true }, orderBy: { sortOrder: "asc" } }),
    ctx.db.invitation.findMany({
      where: { acceptedAt: null, revokedAt: null },
      select: { id: true, email: true, expiresAt: true, createdAt: true, role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, roles, invitations };
}

export async function getRolesPageData(ctx: OrgContext) {
  return ctx.db.role.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isSystem: true,
      isLocked: true,
      permissions: { where: { deletedAt: null }, select: { module: true, action: true, scope: true } },
      fieldAccess: { where: { deletedAt: null }, select: { fieldGroup: true, access: true } },
      _count: { select: { members: { where: { deletedAt: null, status: "ACTIVE" } } } },
    },
  });
}

export async function getRecentAudit(ctx: OrgContext, take = 100) {
  const entries = await ctx.db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
  const actorIds = [...new Set(entries.map((e) => e.actorId).filter((id): id is string => Boolean(id)))];
  const actors = await ctx.db.member.findMany({
    // `deletedAt: undefined` opts out of the soft-delete filter so removed members keep their names.
    where: { userId: { in: actorIds }, deletedAt: undefined },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
  const byUser = new Map(actors.map((a) => [a.userId, a.user]));
  return entries.map((e) => ({ ...e, actor: e.actorId ? (byUser.get(e.actorId) ?? null) : null }));
}
