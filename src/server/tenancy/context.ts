import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { tenantDb, type TenantDb } from "./tenant-db";
import { resolveMembership, type OrgMembership, type SessionUser } from "./resolve";

export type { SessionUser } from "./resolve";

export interface OrgContext extends OrgMembership {
  user: SessionUser;
  db: TenantDb;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email) return null;
  return { id: u.id, name: u.name ?? null, email: u.email, image: u.image ?? null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages/layouts under /w/[orgSlug]. Redirects to login or 404s on failure. */
export const getOrgContext = cache(async (orgSlug: string): Promise<OrgContext> => {
  const user = await requireUser();
  const membership = await resolveMembership(user.id, orgSlug);
  if (!membership) notFound();
  return { ...membership, user, db: tenantDb(membership.org.id) };
});
