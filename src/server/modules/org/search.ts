"use server";

import { can } from "@/server/rbac/check";
import { getSessionUser } from "@/server/tenancy/context";
import { resolveMembership } from "@/server/tenancy/resolve";
import { tenantDb } from "@/server/tenancy/tenant-db";

export interface PersonHit {
  memberId: string;
  name: string | null;
  email: string;
  image: string | null;
  title: string | null;
  department: string | null;
}

export interface SearchResults {
  people: PersonHit[];
  canManageMembers: boolean;
}

/** Workspace search used by the command palette. More entity types join in phase 4. */
export async function searchWorkspace(orgSlug: string, rawQuery: string): Promise<SearchResults> {
  const empty: SearchResults = { people: [], canManageMembers: false };
  const query = rawQuery.trim().slice(0, 100);
  if (query.length < 2) return empty;

  const user = await getSessionUser();
  if (!user) return empty;
  const membership = await resolveMembership(user.id, orgSlug);
  if (!membership) return empty;

  const db = tenantDb(membership.org.id);
  const members = await db.member.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { title: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      user: { select: { name: true, email: true, image: true } },
      department: { select: { name: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 8,
  });

  return {
    canManageMembers: can(membership.actor, "admin", "view"),
    people: members.map((m) => ({
      memberId: m.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      title: m.title,
      department: m.department?.name ?? null,
    })),
  };
}
