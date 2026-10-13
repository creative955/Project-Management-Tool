import { describe, expect, it } from "vitest";
import { diffRecords, isSensitiveKey, normalizeAuditValue, REDACTED } from "./audit-diff";

describe("diffRecords", () => {
  it("records only changed fields", () => {
    expect(diffRecords({ name: "A", country: "IN" }, { name: "B", country: "IN" })).toEqual({
      name: { from: "A", to: "B" },
    });
  });

  it("handles creates and deletes", () => {
    expect(diffRecords(null, { name: "A" })).toEqual({ name: { from: null, to: "A" } });
    expect(diffRecords({ name: "A" }, null)).toEqual({ name: { from: "A", to: null } });
  });

  it("ignores timestamps and requested keys", () => {
    const before = { name: "A", updatedAt: new Date(1), createdAt: new Date(1), secretSauce: 1 };
    const after = { name: "A", updatedAt: new Date(2), createdAt: new Date(2), secretSauce: 2 };
    expect(diffRecords(before, after, { ignore: ["secretSauce"] })).toEqual({});
  });

  it("compares dates, bigints, arrays and objects by value", () => {
    expect(diffRecords({ d: new Date("2026-01-01") }, { d: new Date("2026-01-01") })).toEqual({});
    expect(diffRecords({ amount: 100n }, { amount: 250n })).toEqual({ amount: { from: "100", to: "250" } });
    expect(diffRecords({ days: [1, 2, 3] }, { days: [1, 2, 3] })).toEqual({});
    expect(diffRecords({ days: [1, 2] }, { days: [1, 2, 3] })).toEqual({ days: { from: [1, 2], to: [1, 2, 3] } });
    expect(diffRecords({ o: { b: 1, a: 2 } }, { o: { a: 2, b: 1 } })).toEqual({});
  });

  it("redacts sensitive values but still records that they changed", () => {
    expect(diffRecords({ passwordHash: "x" }, { passwordHash: "y" })).toEqual({
      passwordHash: { from: REDACTED, to: REDACTED },
    });
    expect(diffRecords({ bankAccountNumber: "1" }, { bankAccountNumber: "2" }).bankAccountNumber.to).toBe(REDACTED);
  });

  it("treats undefined and null as equal", () => {
    expect(diffRecords({ a: undefined }, { a: null })).toEqual({});
  });
});

describe("isSensitiveKey", () => {
  it.each(["passwordHash", "tokenHash", "PAN", "panNumber", "ifscCode", "bankAccountNumber", "taxId", "aadhaar", "ssn", "apiSecret"])(
    "%s is sensitive",
    (k) => expect(isSensitiveKey(k)).toBe(true),
  );
  it.each(["company", "name", "companyName", "panel", "expand", "title", "baseCurrency"])("%s is not sensitive", (k) =>
    expect(isSensitiveKey(k)).toBe(false),
  );
});

describe("normalizeAuditValue", () => {
  it("produces JSON-safe output", () => {
    const value = normalizeAuditValue({ when: new Date("2026-04-01T00:00:00Z"), n: 5n, nested: [{ x: undefined }] });
    expect(value).toEqual({ n: "5", nested: [{ x: null }], when: "2026-04-01T00:00:00.000Z" });
    expect(() => JSON.stringify(value)).not.toThrow();
  });
});
