import "server-only";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionErrorCode, ActionResult } from "@/lib/action-result";
import { writeAudit, type AuditEntry } from "@/server/audit/write";
import type { Action, Module } from "@/server/rbac/catalog";
import { ForbiddenError, requireScope } from "@/server/rbac/check";
import { getSessionUser, type SessionUser } from "@/server/tenancy/context";
import { resolveMembership, type OrgMembership } from "@/server/tenancy/resolve";
import { tenantDb, type TenantTx } from "@/server/tenancy/tenant-db";

/** Throw from a handler to return a typed, user-facing failure. */
export class ActionError extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export interface ActionContext extends OrgMembership {
  user: SessionUser;
  /** Tenant-scoped client bound to the action's transaction. */
  db: TenantTx;
  /** Scope granted for the action's declared permission. */
  scope: string;
  audit(entry: AuditEntry): Promise<void>;
}

interface OrgActionConfig<S extends z.ZodType> {
  schema: S;
  permission: { module: Module; action: Action };
}

export function fail(code: ActionErrorCode, error: string, fieldErrors?: Record<string, string[] | undefined>) {
  return { ok: false as const, code, error, fieldErrors };
}

/**
 * Wraps a tenant mutation: auth → membership → RBAC → Zod → transaction → audit.
 * Handlers must call `ctx.audit()` at least once; the transaction is rolled back
 * otherwise, so no mutation can ship without an audit trail.
 */
export function orgAction<S extends z.ZodType, R>(
  config: OrgActionConfig<S>,
  handler: (input: z.output<S>, ctx: ActionContext) => Promise<R>,
) {
  return async (orgSlug: string, rawInput: z.input<S>): Promise<ActionResult<R>> => {
    try {
      const user = await getSessionUser();
      if (!user) return fail("UNAUTHENTICATED", "Please sign in again.");

      const membership = await resolveMembership(user.id, orgSlug);
      if (!membership) return fail("NOT_FOUND", "Workspace not found.");

      const scope = requireScope(membership.actor, config.permission.module, config.permission.action);

      const parsed = config.schema.safeParse(rawInput);
      if (!parsed.success) {
        return fail(
          "VALIDATION",
          "Please fix the highlighted fields.",
          z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
        );
      }

      const h = await headers();
      const meta = {
        orgId: membership.org.id,
        actorId: user.id,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
        userAgent: h.get("user-agent"),
      };

      const data = await tenantDb(membership.org.id).$transaction(async (tx) => {
        let audited = 0;
        const ctx: ActionContext = {
          ...membership,
          user,
          db: tx,
          scope,
          audit: async (entry) => {
            audited++;
            await writeAudit(tx, meta, entry);
          },
        };
        const result = await handler(parsed.data, ctx);
        if (audited === 0) {
          throw new Error(`Action ${config.permission.module}.${config.permission.action} did not write an audit entry`);
        }
        return result;
      });

      return { ok: true, data };
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof ActionError) return fail(error.code, error.message, error.fieldErrors);
      if (error instanceof ForbiddenError) return fail("FORBIDDEN", error.message);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return fail("CONFLICT", "A record with these details already exists.");
      }
      console.error("[orgAction]", error);
      return fail("ERROR", "Something went wrong. Please try again.");
    }
  };
}
