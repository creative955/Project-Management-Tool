import {
  FIELD_ACCESS_LEVELS,
  SCOPES,
  type Action,
  type FieldAccess,
  type FieldAccessMap,
  type FieldGroup,
  type Module,
  type PermissionMap,
  type Scope,
} from "./catalog";

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface Actor {
  memberId: string;
  departmentId: string | null;
  /** Member ids of everyone reporting to the actor, directly or transitively. */
  reportIds: readonly string[];
  permissions: PermissionMap;
  fieldAccess: FieldAccessMap;
}

/** The people a record "belongs to" for scope checks (owner, assignees, subject…). */
export interface RecordOwnership {
  memberIds: readonly (string | null | undefined)[];
  departmentId?: string | null;
}

export function scopeRank(scope: Scope): number {
  return SCOPES.indexOf(scope);
}

export function maxScope(a: Scope, b: Scope): Scope {
  return scopeRank(a) >= scopeRank(b) ? a : b;
}

export function getScope(permissions: PermissionMap, module: Module, action: Action): Scope {
  return permissions[`${module}.${action}`] ?? "NONE";
}

export function can(actor: Pick<Actor, "permissions">, module: Module, action: Action): boolean {
  return getScope(actor.permissions, module, action) !== "NONE";
}

/** Throws ForbiddenError when the actor has no scope at all; returns the scope otherwise. */
export function requireScope(
  actor: Pick<Actor, "permissions">,
  module: Module,
  action: Action,
): Exclude<Scope, "NONE"> {
  const scope = getScope(actor.permissions, module, action);
  if (scope === "NONE") throw new ForbiddenError();
  return scope;
}

export function scopeAllows(
  scope: Scope,
  actor: Pick<Actor, "memberId" | "departmentId" | "reportIds">,
  record: RecordOwnership,
): boolean {
  const owners = record.memberIds.filter((id): id is string => Boolean(id));
  const ownsIt = owners.includes(actor.memberId);
  switch (scope) {
    case "NONE":
      return false;
    case "OWN":
      return ownsIt;
    case "TEAM": {
      if (ownsIt) return true;
      const team = new Set(actor.reportIds);
      return owners.some((id) => team.has(id));
    }
    case "DEPARTMENT":
      return (
        ownsIt ||
        (actor.departmentId !== null &&
          record.departmentId !== undefined &&
          record.departmentId === actor.departmentId)
      );
    case "ALL":
      return true;
  }
}

export function canOnRecord(
  actor: Actor,
  module: Module,
  action: Action,
  record: RecordOwnership,
): boolean {
  return scopeAllows(getScope(actor.permissions, module, action), actor, record);
}

/**
 * Effective access to a sensitive field group on a subject member's record.
 * A member always has at least VIEW on their own data.
 */
export function fieldAccessFor(
  actor: Pick<Actor, "memberId" | "fieldAccess">,
  group: FieldGroup,
  subjectMemberId: string | null,
): FieldAccess {
  const granted = actor.fieldAccess[group] ?? "HIDDEN";
  if (subjectMemberId !== null && subjectMemberId === actor.memberId) {
    return FIELD_ACCESS_LEVELS.indexOf(granted) >= FIELD_ACCESS_LEVELS.indexOf("VIEW")
      ? granted
      : "VIEW";
  }
  return granted;
}

/**
 * Collects every member reporting to `managerId`, directly or transitively.
 * Safe against cycles in bad data.
 */
export function collectReports(
  members: readonly { id: string; managerId: string | null }[],
  managerId: string,
): string[] {
  const byManager = new Map<string, string[]>();
  for (const m of members) {
    if (!m.managerId) continue;
    const list = byManager.get(m.managerId) ?? [];
    list.push(m.id);
    byManager.set(m.managerId, list);
  }
  const seen = new Set<string>([managerId]);
  const result: string[] = [];
  const queue = [...(byManager.get(managerId) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    queue.push(...(byManager.get(id) ?? []));
  }
  return result;
}

export function maskValue(value: string | null | undefined, visible = 4): string {
  if (!value) return "";
  const keep = value.slice(-visible);
  return `${"•".repeat(Math.max(4, value.length - visible))}${keep}`;
}
