import type { Prisma } from "@prisma/client";
import { writeAudit } from "@/server/audit/write";
import { hashInviteToken } from "./invite-token";

export type InvitationStatus = "valid" | "invalid" | "expired" | "revoked" | "accepted";

export async function findInvitation(db: Prisma.TransactionClient, token: string) {
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: {
      org: { select: { id: true, name: true, slug: true, deletedAt: true } },
      role: { select: { id: true, name: true } },
    },
  });
  let status: InvitationStatus = "valid";
  if (!invitation || invitation.deletedAt || invitation.org.deletedAt) status = "invalid";
  else if (invitation.acceptedAt) status = "accepted";
  else if (invitation.revokedAt) status = "revoked";
  else if (invitation.expiresAt.getTime() < Date.now()) status = "expired";
  return { invitation, status };
}

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

/** Accepts an invitation for the signed-in user. The invite email must match. */
export async function acceptInvitation(
  tx: Prisma.TransactionClient,
  input: { token: string; userId: string; userEmail: string },
): Promise<{ orgSlug: string; memberId: string }> {
  const { invitation, status } = await findInvitation(tx, input.token);
  if (!invitation || status !== "valid") throw new InvitationError(`This invitation is ${status}.`);
  if (invitation.email.toLowerCase() !== input.userEmail.toLowerCase()) {
    throw new InvitationError("This invitation was sent to a different email address.");
  }

  const existing = await tx.member.findUnique({
    where: { orgId_userId: { orgId: invitation.orgId, userId: input.userId } },
  });
  const member = existing
    ? await tx.member.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", deletedAt: null, roleId: invitation.roleId },
      })
    : await tx.member.create({
        data: {
          orgId: invitation.orgId,
          userId: input.userId,
          roleId: invitation.roleId,
          createdById: invitation.createdById,
        },
      });

  await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
  await writeAudit(
    tx,
    { orgId: invitation.orgId, actorId: input.userId },
    {
      action: "member.joined",
      entityType: "Member",
      entityId: member.id,
      after: { email: input.userEmail, role: invitation.role.name },
      metadata: { invitationId: invitation.id },
    },
  );
  return { orgSlug: invitation.org.slug, memberId: member.id };
}
