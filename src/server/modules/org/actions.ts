"use server";

import { revalidatePath } from "next/cache";
import { ActionError, orgAction, type ActionContext } from "@/server/actions/org-action";
import { generateInviteToken, hashInviteToken } from "./invite-token";
import {
  changeRoleSchema,
  invitationIdSchema,
  inviteMemberSchema,
  memberIdSchema,
  orgSettingsSchema,
} from "./schemas";

const INVITE_TTL_DAYS = 7;

function revalidateOrg(ctx: ActionContext) {
  revalidatePath(`/w/${ctx.org.slug}`, "layout");
}

async function countActiveOwners(ctx: ActionContext, excludingMemberId?: string): Promise<number> {
  return ctx.db.member.count({
    where: {
      status: "ACTIVE",
      role: { key: "owner" },
      ...(excludingMemberId ? { id: { not: excludingMemberId } } : {}),
    },
  });
}

function assertOwnerActor(ctx: ActionContext, message: string) {
  if (ctx.role.key !== "owner") throw new ActionError("FORBIDDEN", message);
}

export const updateOrganizationSettings = orgAction(
  { schema: orgSettingsSchema, permission: { module: "admin", action: "edit" } },
  async (input, ctx) => {
    const before = await ctx.db.organization.findUniqueOrThrow({ where: { id: ctx.org.id } });
    const after = await ctx.db.organization.update({
      where: { id: ctx.org.id },
      data: { ...input, workingDays: [...new Set(input.workingDays)].sort((a, b) => a - b) },
    });
    await ctx.audit({
      action: "organization.settings_updated",
      entityType: "Organization",
      entityId: ctx.org.id,
      before,
      after,
    });
    revalidateOrg(ctx);
    return { id: after.id };
  },
);

export const inviteMember = orgAction(
  { schema: inviteMemberSchema, permission: { module: "admin", action: "create" } },
  async (input, ctx) => {
    const role = await ctx.db.role.findFirst({ where: { id: input.roleId } });
    if (!role) throw new ActionError("VALIDATION", "Choose a valid role", { roleId: ["Choose a valid role"] });
    if (role.key === "owner") assertOwnerActor(ctx, "Only owners can invite other owners.");

    const existingMember = await ctx.db.member.findFirst({ where: { user: { email: input.email } } });
    if (existingMember) {
      throw new ActionError("CONFLICT", "This person is already a member of the workspace.", {
        email: ["Already a member"],
      });
    }

    await ctx.db.invitation.updateMany({
      where: { email: input.email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const token = generateInviteToken();
    const invitation = await ctx.db.invitation.create({
      data: {
        orgId: ctx.org.id,
        email: input.email,
        roleId: role.id,
        tokenHash: hashInviteToken(token),
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        createdById: ctx.user.id,
      },
    });
    await ctx.audit({
      action: "member.invited",
      entityType: "Invitation",
      entityId: invitation.id,
      after: { email: input.email, role: role.name },
    });
    revalidateOrg(ctx);
    // The raw token is only ever returned here; only its hash is stored.
    return { invitationId: invitation.id, invitePath: `/invite/${token}` };
  },
);

export const revokeInvitation = orgAction(
  { schema: invitationIdSchema, permission: { module: "admin", action: "delete" } },
  async (input, ctx) => {
    const invitation = await ctx.db.invitation.findFirst({
      where: { id: input.invitationId, acceptedAt: null, revokedAt: null },
    });
    if (!invitation) throw new ActionError("NOT_FOUND", "Invitation not found or already used.");
    await ctx.db.invitation.update({ where: { id: invitation.id }, data: { revokedAt: new Date() } });
    await ctx.audit({
      action: "member.invitation_revoked",
      entityType: "Invitation",
      entityId: invitation.id,
      before: { email: invitation.email, status: "pending" },
      after: { email: invitation.email, status: "revoked" },
    });
    revalidateOrg(ctx);
    return { id: invitation.id };
  },
);

export const changeMemberRole = orgAction(
  { schema: changeRoleSchema, permission: { module: "admin", action: "edit" } },
  async (input, ctx) => {
    const member = await ctx.db.member.findFirst({
      where: { id: input.memberId },
      include: { role: true, user: { select: { email: true } } },
    });
    if (!member) throw new ActionError("NOT_FOUND", "Member not found.");
    const role = await ctx.db.role.findFirst({ where: { id: input.roleId } });
    if (!role) throw new ActionError("VALIDATION", "Choose a valid role.");
    if (member.roleId === role.id) return { id: member.id };

    if (role.key === "owner" || member.role.key === "owner") {
      assertOwnerActor(ctx, "Only owners can grant or remove the Owner role.");
    }
    if (member.role.key === "owner" && (await countActiveOwners(ctx, member.id)) === 0) {
      throw new ActionError("CONFLICT", "A workspace needs at least one owner.");
    }

    await ctx.db.member.update({ where: { id: member.id }, data: { roleId: role.id } });
    await ctx.audit({
      action: "member.role_changed",
      entityType: "Member",
      entityId: member.id,
      before: { role: member.role.name },
      after: { role: role.name },
      metadata: { email: member.user.email },
    });
    revalidateOrg(ctx);
    return { id: member.id };
  },
);

export const suspendMember = orgAction(
  { schema: memberIdSchema, permission: { module: "admin", action: "delete" } },
  async (input, ctx) => {
    if (input.memberId === ctx.member.id) throw new ActionError("CONFLICT", "You can't suspend yourself.");
    const member = await ctx.db.member.findFirst({
      where: { id: input.memberId, status: "ACTIVE" },
      include: { role: true, user: { select: { email: true } } },
    });
    if (!member) throw new ActionError("NOT_FOUND", "Member not found or already suspended.");
    if (member.role.key === "owner") {
      assertOwnerActor(ctx, "Only owners can suspend another owner.");
      if ((await countActiveOwners(ctx, member.id)) === 0) {
        throw new ActionError("CONFLICT", "A workspace needs at least one owner.");
      }
    }
    await ctx.db.member.update({ where: { id: member.id }, data: { status: "SUSPENDED" } });
    await ctx.audit({
      action: "member.suspended",
      entityType: "Member",
      entityId: member.id,
      before: { status: "ACTIVE" },
      after: { status: "SUSPENDED" },
      metadata: { email: member.user.email },
    });
    revalidateOrg(ctx);
    return { id: member.id };
  },
);

export const restoreMember = orgAction(
  { schema: memberIdSchema, permission: { module: "admin", action: "edit" } },
  async (input, ctx) => {
    const member = await ctx.db.member.findFirst({
      where: { id: input.memberId, status: "SUSPENDED" },
      include: { user: { select: { email: true } } },
    });
    if (!member) throw new ActionError("NOT_FOUND", "Member not found or already active.");
    await ctx.db.member.update({ where: { id: member.id }, data: { status: "ACTIVE" } });
    await ctx.audit({
      action: "member.restored",
      entityType: "Member",
      entityId: member.id,
      before: { status: "SUSPENDED" },
      after: { status: "ACTIVE" },
      metadata: { email: member.user.email },
    });
    revalidateOrg(ctx);
    return { id: member.id };
  },
);
