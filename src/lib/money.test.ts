import { describe, expect, it } from "vitest";
import {
  add,
  allocate,
  convert,
  divideRound,
  formatMoney,
  minorUnitExponent,
  money,
  MoneyError,
  multiplyDecimal,
  multiplyRatio,
  parseDecimal,
  parseMoney,
  percentOf,
  serializeMoney,
  splitEvenly,
  subtract,
  sum,
  toMajorString,
  toMinor,
} from "./money";

describe("minorUnitExponent", () => {
  it("uses ISO-4217 exponents", () => {
    expect(minorUnitExponent("INR")).toBe(2);
    expect(minorUnitExponent("USD")).toBe(2);
    expect(minorUnitExponent("AED")).toBe(2);
    expect(minorUnitExponent("KWD")).toBe(3);
    expect(minorUnitExponent("BHD")).toBe(3);
    expect(minorUnitExponent("OMR")).toBe(3);
    expect(minorUnitExponent("JPY")).toBe(0);
  });

  it("rejects malformed codes", () => {
    expect(() => minorUnitExponent("usd")).toThrow(MoneyError);
    expect(() => minorUnitExponent("US")).toThrow(MoneyError);
  });
});

describe("divideRound", () => {
  const cases: [bigint, bigint, Parameters<typeof divideRound>[2], bigint][] = [
    [5n, 2n, "HALF_UP", 3n],
    [-5n, 2n, "HALF_UP", -3n],
    [5n, 2n, "HALF_DOWN", 2n],
    [-5n, 2n, "HALF_DOWN", -2n],
    [5n, 2n, "HALF_EVEN", 2n],
    [7n, 2n, "HALF_EVEN", 4n],
    [-7n, 2n, "HALF_EVEN", -4n],
    [7n, 3n, "HALF_EVEN", 2n],
    [8n, 3n, "HALF_EVEN", 3n],
    [7n, 3n, "UP", 3n],
    [-7n, 3n, "UP", -3n],
    [7n, 3n, "DOWN", 2n],
    [-7n, 3n, "DOWN", -2n],
    [-7n, 3n, "FLOOR", -3n],
    [7n, 3n, "FLOOR", 2n],
    [7n, 3n, "CEIL", 3n],
    [-7n, 3n, "CEIL", -2n],
    [6n, 3n, "UP", 2n],
    [5n, -2n, "HALF_UP", -3n],
  ];
  it.each(cases)("%s / %s (%s) = %s", (n, d, mode, expected) => {
    expect(divideRound(n, d, mode)).toBe(expected);
  });

  it("throws on division by zero", () => {
    expect(() => divideRound(1n, 0n)).toThrow(MoneyError);
  });
});

describe("parseDecimal / toMinor / toMajorString", () => {
  it("parses exact decimals without floats", () => {
    expect(parseDecimal("1,234.5600")).toEqual({ value: 12345600n, scale: 4 });
    expect(parseDecimal("-0.1")).toEqual({ value: -1n, scale: 1 });
    expect(parseDecimal(".5")).toEqual({ value: 5n, scale: 1 });
    expect(() => parseDecimal("1.2.3")).toThrow(MoneyError);
    expect(() => parseDecimal("abc")).toThrow(MoneyError);
    expect(() => parseDecimal("")).toThrow(MoneyError);
  });

  it("converts major to minor units per currency", () => {
    expect(toMinor("1234.56", "INR")).toBe(123456n);
    expect(toMinor("10", "USD")).toBe(1000n);
    expect(toMinor("0.1", "USD")).toBe(10n);
    expect(toMinor("12.345", "KWD")).toBe(12345n);
    expect(toMinor("1500", "JPY")).toBe(1500n);
    expect(toMinor("-19.99", "GBP")).toBe(-1999n);
  });

  it("handles values beyond Number.MAX_SAFE_INTEGER", () => {
    expect(toMinor("123456789012345678.91", "INR")).toBe(12345678901234567891n);
    expect(toMajorString(12345678901234567891n, "INR")).toBe("123456789012345678.91");
  });

  it("refuses excess precision unless a rounding mode is supplied", () => {
    expect(() => toMinor("1.005", "USD")).toThrow(MoneyError);
    expect(toMinor("1.005", "USD", "HALF_UP")).toBe(101n);
    expect(toMinor("1.005", "USD", "HALF_EVEN")).toBe(100n);
    expect(toMinor("1.5", "JPY", "HALF_EVEN")).toBe(2n);
  });

  it("formats minor units back to canonical strings", () => {
    expect(toMajorString(123456n, "INR")).toBe("1234.56");
    expect(toMajorString(5n, "USD")).toBe("0.05");
    expect(toMajorString(-5n, "USD")).toBe("-0.05");
    expect(toMajorString(0n, "USD")).toBe("0.00");
    expect(toMajorString(12345n, "KWD")).toBe("12.345");
    expect(toMajorString(1500n, "JPY")).toBe("1500");
  });

  it("round-trips", () => {
    for (const v of ["0.00", "0.01", "999999.99", "-42.10"]) {
      expect(toMajorString(toMinor(v, "USD"), "USD")).toBe(v);
    }
  });
});

describe("formatMoney", () => {
  it("formats with locale grouping (Indian lakh/crore for INR)", () => {
    expect(formatMoney(1234567_89n, "INR", { locale: "en-IN" })).toBe("₹12,34,567.89");
    expect(formatMoney(123456n, "USD", { locale: "en-US" })).toBe("$1,234.56");
    expect(formatMoney(12345n, "KWD", { locale: "en-US", display: "code" })).toMatch(/KWD\s?12\.345/);
  });

  it("formats huge amounts exactly", () => {
    expect(formatMoney(900719925474099312n, "USD", { locale: "en-US" })).toBe("$9,007,199,254,740,993.12");
  });
});

describe("arithmetic", () => {
  it("adds, subtracts and sums in one currency", () => {
    expect(add(money(100n, "INR"), money(250n, "INR")).amount).toBe(350n);
    expect(subtract(money(100n, "INR"), money(250n, "INR")).amount).toBe(-150n);
    expect(sum([money(1n, "USD"), money(2n, "USD"), money(3n, "USD")], "USD").amount).toBe(6n);
    expect(sum([], "USD").amount).toBe(0n);
  });

  it("refuses to mix currencies", () => {
    expect(() => add(money(1n, "INR"), money(1n, "USD"))).toThrow(/Currency mismatch/);
  });

  it("multiplies by ratios and decimals with a single rounding step", () => {
    expect(multiplyRatio(100000n, 1n, 3n)).toBe(33333n);
    expect(multiplyRatio(100000n, 2n, 3n)).toBe(66667n);
    expect(multiplyDecimal(10000n, "1.18")).toBe(11800n);
    expect(multiplyDecimal(333n, "0.5", "HALF_EVEN")).toBe(166n);
    expect(multiplyDecimal(333n, "0.5", "HALF_UP")).toBe(167n);
  });

  it("computes percentages", () => {
    expect(percentOf(100000n, "12.5")).toBe(12500n);
    expect(percentOf(1999n, "18")).toBe(360n); // 359.82 → 360
    expect(percentOf(50000_00n, "40")).toBe(20000_00n);
    expect(percentOf(-1999n, "18")).toBe(-360n);
    expect(percentOf(100n, "0.005")).toBe(0n);
  });
});

describe("convert", () => {
  it("converts using a decimal rate and per-currency exponents", () => {
    expect(convert(100_00n, "USD", "INR", "83.2450")).toBe(8324_50n);
    expect(convert(1_000n, "KWD", "USD", "3.25")).toBe(325n); // 1.000 KWD → 3.25 USD
    expect(convert(1000n, "JPY", "USD", "0.0067")).toBe(670n);
    expect(convert(1_00n, "USD", "JPY", "151.37")).toBe(151n);
  });

  it("rejects non-positive rates", () => {
    expect(() => convert(1n, "USD", "INR", "0")).toThrow(MoneyError);
    expect(() => convert(1n, "USD", "INR", "-1")).toThrow(MoneyError);
  });
});

describe("allocate", () => {
  it("always sums to the original amount", () => {
    for (const total of [0n, 1n, 100n, 99999n, -100n, 1234567891n]) {
      for (const ratios of [[1, 1, 1], [70, 20, 10], [1, 0, 2], [3, 7], [1]]) {
        const parts = allocate(total, ratios);
        expect(parts.reduce((a, b) => a + b, 0n)).toBe(total);
        expect(parts).toHaveLength(ratios.length);
      }
    }
  });

  it("distributes remainders to the largest fractional parts", () => {
    expect(allocate(100n, [1, 1, 1])).toEqual([34n, 33n, 33n]);
    expect(allocate(-100n, [1, 1, 1])).toEqual([-34n, -33n, -33n]);
    // 1.5 and 3.5 have equal remainders, so the tie goes to the first index.
    expect(allocate(5n, [3, 7])).toEqual([2n, 3n]);
    expect(allocate(10n, [1, 2, 4])).toEqual([1n, 3n, 6n]);
    expect(allocate(1000n, [1, 0, 2])).toEqual([333n, 0n, 667n]);
  });

  it("splits evenly", () => {
    expect(splitEvenly(1000n, 3)).toEqual([334n, 333n, 333n]);
    expect(() => splitEvenly(1n, 0)).toThrow(MoneyError);
  });

  it("validates ratios", () => {
    expect(() => allocate(1n, [])).toThrow(MoneyError);
    expect(() => allocate(1n, [0, 0])).toThrow(MoneyError);
    expect(() => allocate(1n, [-1, 2])).toThrow(MoneyError);
    expect(() => allocate(1n, [0.5, 0.5])).toThrow(MoneyError);
  });
});

describe("serialisation", () => {
  it("round-trips bigint through strings", () => {
    const m = money(12345678901234567890n, "INR");
    expect(parseMoney(serializeMoney(m))).toEqual(m);
    expect(() => parseMoney({ amount: "1.5", currency: "INR" })).toThrow(MoneyError);
  });
});
