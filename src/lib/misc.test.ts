import { describe, expect, it } from "vitest";
import { ALL_NAV_ITEMS, findNavItem } from "@/config/navigation";
import { QUICK_CREATE } from "@/config/quick-create";
import { isEditableTarget, normalizeKey } from "@/hooks/use-hotkeys";
import { safeCallbackUrl } from "./safe-redirect";

describe("safeCallbackUrl", () => {
  it("allows same-origin relative paths", () => {
    expect(safeCallbackUrl("/w/northlight/home")).toBe("/w/northlight/home");
    expect(safeCallbackUrl("/invite/abc?x=1")).toBe("/invite/abc?x=1");
  });

  it("rejects open redirects and junk", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "", null, 42, "/a\r\nSet-Cookie:x"]) {
      expect(safeCallbackUrl(bad, "/fallback")).toBe("/fallback");
    }
  });
});

describe("normalizeKey", () => {
  const ev = (key: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "shiftKey" | "altKey", boolean>> = {}) => ({
    key,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  });

  it("maps Cmd and Ctrl to mod", () => {
    expect(normalizeKey(ev("k", { metaKey: true }))).toBe("mod+k");
    expect(normalizeKey(ev("K", { ctrlKey: true, shiftKey: true }))).toBe("mod+shift+k");
  });

  it("adds shift only for letters", () => {
    expect(normalizeKey(ev("T", { shiftKey: true }))).toBe("shift+t");
    expect(normalizeKey(ev("?", { shiftKey: true }))).toBe("?");
    expect(normalizeKey(ev("["))).toBe("[");
    expect(normalizeKey(ev("Escape"))).toBe("escape");
  });

  it("does not treat non-elements as editable", () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("navigation config", () => {
  it("has unique hrefs", () => {
    const hrefs = ALL_NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("matches the most specific item for nested paths", () => {
    expect(findNavItem("crm/leads")?.title).toBe("Leads");
    expect(findNavItem("/crm/leads/abc123")?.title).toBe("Leads");
    expect(findNavItem("settings/members")?.title).toBe("Members");
    expect(findNavItem("settings")?.title).toBe("General");
    expect(findNavItem("nope")).toBeUndefined();
  });

  it("points every quick-create action at a known screen", () => {
    for (const q of QUICK_CREATE) expect(findNavItem(q.href.split("?")[0])).toBeDefined();
  });
});
