import type { Metadata } from "next";
import { getMembersPageData } from "@/server/modules/org/queries";
import { can } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";
import { MembersView } from "./members-view";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string; invite?: string }>;
}) {
  const [{ orgSlug }, sp] = await Promise.all([params, searchParams]);
  const ctx = await getOrgContext(orgSlug);
  const { members, roles, invitations } = await getMembersPageData(ctx);
  const now = Date.now();
  const canInvite = can(ctx.actor, "admin", "create");

  return (
    <MembersView
      orgSlug={ctx.org.slug}
      currentMemberId={ctx.member.id}
      initialQuery={sp.q ?? ""}
      openInvite={sp.invite === "1" && canInvite}
      roles={roles}
      perms={{
        canInvite,
        canEdit: can(ctx.actor, "admin", "edit"),
        canSuspend: can(ctx.actor, "admin", "delete"),
        isOwner: ctx.role.key === "owner",
      }}
      members={members.map((m) => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        title: m.title,
        status: m.status,
        roleId: m.role.id,
        roleName: m.role.name,
        roleKey: m.role.key,
        department: m.department?.name ?? null,
        location: m.location?.name ?? null,
        manager: m.manager?.user.name ?? null,
        joinedAt: m.joinedAt.toISOString(),
      }))}
      invitations={invitations.map((i) => ({
        id: i.id,
        email: i.email,
        roleName: i.role.name,
        expiresAt: i.expiresAt.toISOString(),
        expired: i.expiresAt.getTime() < now,
      }))}
    />
  );
}
