export type AuditChanges = Record<string, { from: unknown; to: unknown }>;

export const REDACTED = "[REDACTED]";

const ALWAYS_IGNORED = new Set(["updatedAt", "createdAt"]);

const SENSITIVE_TOKENS = new Set([
  "password",
  "secret",
  "token",
  "hash",
  "iban",
  "ifsc",
  "swift",
  "pan",
  "aadhaar",
  "ssn",
  "nino",
  "tin",
]);
const SENSITIVE_PHRASES = ["accountnumber", "taxid", "routingnumber", "sortcode"];

/** Normalises a value into a JSON-safe, comparable form. */
export function normalizeAuditValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeAuditValue);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      out[key] = normalizeAuditValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** Token-based so that e.g. "company" is not mistaken for "pan". */
export function isSensitiveKey(key: string): boolean {
  const tokens = key
    .split(/(?=[A-Z])|[_\-.]/)
    .map((t) => t.toLowerCase())
    .filter(Boolean);
  const compact = tokens.join("");
  return (
    SENSITIVE_TOKENS.has(compact) ||
    tokens.some((t) => SENSITIVE_TOKENS.has(t)) ||
    SENSITIVE_PHRASES.some((phrase) => compact.includes(phrase))
  );
}

/**
 * Field-level diff between two records. Sensitive keys are recorded as changed
 * but their values are redacted.
 */
export function diffRecords(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  options: { ignore?: readonly string[] } = {},
): AuditChanges {
  const ignore = new Set([...ALWAYS_IGNORED, ...(options.ignore ?? [])]);
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changes: AuditChanges = {};
  for (const key of [...keys].sort()) {
    if (ignore.has(key)) continue;
    const from = normalizeAuditValue(before?.[key]);
    const to = normalizeAuditValue(after?.[key]);
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes[key] = isSensitiveKey(key) ? { from: REDACTED, to: REDACTED } : { from, to };
  }
  return changes;
}
