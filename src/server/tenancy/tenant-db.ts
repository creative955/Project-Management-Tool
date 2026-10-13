import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";

const models = Prisma.dmmf.datamodel.models;

/** Models carrying an `orgId` column (discovered from the schema). */
export const TENANT_MODELS: ReadonlySet<string> = new Set(
  models.filter((m) => m.fields.some((f) => f.name === "orgId")).map((m) => m.name),
);

/** Tenant models that also support soft delete. */
export const SOFT_DELETE_MODELS: ReadonlySet<string> = new Set(
  models
    .filter((m) => TENANT_MODELS.has(m.name) && m.fields.some((f) => f.name === "deletedAt"))
    .map((m) => m.name),
);

const READ_OPS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);
const WRITE_WHERE_OPS = new Set([
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
]);
const CREATE_OPS = new Set(["create", "createMany", "createManyAndReturn"]);

export class TenantViolationError extends Error {
  constructor(model: string) {
    super(`Refusing to write ${model} for a different organisation`);
    this.name = "TenantViolationError";
  }
}

type Args = Record<string, unknown>;

function scopeData(model: string, data: unknown, orgId: string): unknown {
  if (Array.isArray(data)) return data.map((d) => scopeData(model, d, orgId));
  const record = (data ?? {}) as Args;
  if (record.orgId !== undefined && record.orgId !== orgId) throw new TenantViolationError(model);
  return { ...record, orgId };
}

/**
 * Rewrites Prisma args so that a query can only see/touch rows of `orgId`.
 * Exported for unit testing; use `tenantDb()` in application code.
 */
export function scopeArgs(model: string, operation: string, rawArgs: unknown, orgId: string): Args {
  if (!TENANT_MODELS.has(model)) return (rawArgs ?? {}) as Args;
  const args: Args = { ...((rawArgs ?? {}) as Args) };
  const where = (args.where ?? {}) as Args;

  if (READ_OPS.has(operation)) {
    const scoped: Args = { ...where, orgId };
    if (SOFT_DELETE_MODELS.has(model) && !("deletedAt" in where)) scoped.deletedAt = null;
    args.where = scoped;
  } else if (WRITE_WHERE_OPS.has(operation)) {
    args.where = { ...where, orgId };
  } else if (CREATE_OPS.has(operation)) {
    args.data = scopeData(model, args.data, orgId);
  } else if (operation === "upsert") {
    args.where = { ...where, orgId };
    args.create = scopeData(model, args.create, orgId);
  }
  return args;
}

export function tenantDb(orgId: string, client: PrismaClient = prisma) {
  return client.$extends({
    name: "tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return query(scopeArgs(model, operation, args, orgId) as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;
/** Client available inside `tenantDb(orgId).$transaction(async (tx) => …)`. */
export type TenantTx = Parameters<Parameters<TenantDb["$transaction"]>[0]>[0];
