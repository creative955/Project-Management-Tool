import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("Northlight Studio")).toBe("northlight-studio");
    expect(slugify("  Café Délice & Co.  ")).toBe("cafe-delice-and-co");
    expect(slugify("Al Noor — Properties!!")).toBe("al-noor-properties");
    expect(slugify("---")).toBe("");
  });

  it("truncates to 48 characters without a trailing dash", () => {
    const slug = slugify("a".repeat(47) + " b c");
    expect(slug.length).toBeLessThanOrEqual(48);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("accepts well-formed slugs and rejects reserved or malformed ones", () => {
    expect(isValidSlug("northlight")).toBe(true);
    expect(isValidSlug("north-light-2")).toBe(true);
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("North")).toBe(false);
    expect(isValidSlug("north--light")).toBe(false);
    expect(isValidSlug("-north")).toBe(false);
    expect(isValidSlug("settings")).toBe(false);
    expect(isValidSlug("api")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("appends a counter until the slug is free", async () => {
    const taken = new Set(["northlight", "northlight-2"]);
    expect(await uniqueSlug("Northlight", async (s) => taken.has(s))).toBe("northlight-3");
    expect(await uniqueSlug("Fresh Co", async () => false)).toBe("fresh-co");
  });

  it("never returns a reserved slug", async () => {
    const slug = await uniqueSlug("Settings", async () => false);
    expect(isValidSlug(slug)).toBe(true);
  });
});
