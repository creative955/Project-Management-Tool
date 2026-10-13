export const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "app",
  "auth",
  "invite",
  "login",
  "logout",
  "new",
  "onboarding",
  "settings",
  "signup",
  "static",
  "w",
  "www",
]);

export const SLUG_MAX_LENGTH = 48;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= 3 &&
    slug.length <= SLUG_MAX_LENGTH &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  );
}

/** Returns `base`, or `base-2`, `base-3`… — the first candidate `isTaken` rejects. */
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "workspace";
  const safeRoot = RESERVED_SLUGS.has(root) || root.length < 3 ? `${root}-team`.replace(/^-/, "") : root;
  for (let n = 1; n < 1000; n++) {
    const suffix = n === 1 ? "" : `-${n}`;
    const candidate = `${safeRoot.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}
