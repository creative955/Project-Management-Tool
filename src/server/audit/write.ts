import type { Prisma } from "@prisma/client";
import { diffRecords, normalizeAuditValue } from "@/lib/audit-diff";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** Keys excluded from the diff (timestamps are always excluded). */
  ignore?: readonly string[];
  metadata?: Record<string, unknown>;
}

export interface AuditActorMeta {
  orgId: string;
  actorId: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/** Minimal client surface so both raw and tenant-scoped transaction clients work. */
export interface AuditClient {
  auditLog: { create(args: { data: Prisma.AuditLogUncheckedCreateInput }): Promise<unknown> };
}

export async function writeAudit(db: AuditClient, actor: AuditActorMeta, entry: AuditEntry): Promise<void> {
  const changes = diffRecords(entry.before, entry.after, { ignore: entry.ignore });
  await db.auditLog.create({
    data: {
      orgId: actor.orgId,
      actorId: actor.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      changes: Object.keys(changes).length > 0 ? (changes as Prisma.InputJsonValue) : undefined,
      metadata: entry.metadata
        ? (normalizeAuditValue(entry.metadata) as Prisma.InputJsonValue)
        : undefined,
      ip: actor.ip ?? null,
      userAgent: actor.userAgent?.slice(0, 512) ?? null,
    },
  });
}
