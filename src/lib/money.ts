/**
 * Money is always an integer count of minor units (bigint) plus an ISO-4217 code.
 * Nothing in this module converts money through IEEE-754 floats.
 */

export type RoundingMode =
  | "HALF_UP" // ties away from zero (commercial rounding)
  | "HALF_DOWN" // ties toward zero
  | "HALF_EVEN" // ties to even (banker's rounding)
  | "UP" // away from zero
  | "DOWN" // toward zero (truncate)
  | "CEIL" // toward +infinity
  | "FLOOR"; // toward -infinity

export interface Money {
  readonly amount: bigint;
  readonly currency: string;
}

const EXPONENT_OVERRIDES: Readonly<Record<string, number>> = {
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
  CLP: 0,
  ISK: 0,
  JPY: 0,
  KRW: 0,
  UGX: 0,
  VND: 0,
  XAF: 0,
  XOF: 0,
};

export const SUPPORTED_CURRENCIES = [
  "INR",
  "USD",
  "GBP",
  "EUR",
  "AUD",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "SGD",
  "CAD",
  "JPY",
] as const;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

function assertCurrency(currency: string): string {
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new MoneyError(`Invalid ISO-4217 currency code: "${currency}"`);
  }
  return currency;
}

export function minorUnitExponent(currency: string): number {
  return EXPONENT_OVERRIDES[assertCurrency(currency)] ?? 2;
}

const pow10 = (n: number): bigint => 10n ** BigInt(n);
const abs = (n: bigint): bigint => (n < 0n ? -n : n);

/** Integer division of n / d with an explicit rounding mode. */
export function divideRound(n: bigint, d: bigint, mode: RoundingMode = "HALF_UP"): bigint {
  if (d === 0n) throw new MoneyError("Division by zero");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const q = n / d; // truncates toward zero
  const r = n % d; // sign follows n
  if (r === 0n) return q;
  const sign = n < 0n ? -1n : 1n;
  const twiceRemainder = 2n * abs(r);

  switch (mode) {
    case "DOWN":
      return q;
    case "UP":
      return q + sign;
    case "FLOOR":
      return n < 0n ? q - 1n : q;
    case "CEIL":
      return n > 0n ? q + 1n : q;
    case "HALF_UP":
      return twiceRemainder >= d ? q + sign : q;
    case "HALF_DOWN":
      return twiceRemainder > d ? q + sign : q;
    case "HALF_EVEN":
      if (twiceRemainder > d) return q + sign;
      if (twiceRemainder < d) return q;
      return q % 2n === 0n ? q : q + sign;
  }
}

/** Parses a plain decimal string ("-1234.5678") into a scaled integer. */
export function parseDecimal(input: string): { value: bigint; scale: number } {
  const s = input.trim().replace(/[,_\s]/g, "");
  const match = /^([+-])?(\d*)(?:\.(\d*))?$/.exec(s);
  if (!match || (match[2] === "" && (match[3] ?? "") === "")) {
    throw new MoneyError(`Invalid decimal: "${input}"`);
  }
  const [, sign, intPart, fracPart = ""] = match;
  const digits = `${intPart || "0"}${fracPart}`;
  const value = BigInt(digits) * (sign === "-" ? -1n : 1n);
  return { value, scale: fracPart.length };
}

/**
 * Converts a decimal string in major units ("1234.56") to minor units.
 * Throws if the input has more precision than the currency allows, unless a
 * rounding mode is given.
 */
export function toMinor(decimal: string, currency: string, mode?: RoundingMode): bigint {
  const exp = minorUnitExponent(currency);
  const { value, scale } = parseDecimal(decimal);
  if (scale <= exp) return value * pow10(exp - scale);
  if (!mode) {
    throw new MoneyError(
      `"${decimal}" has more than ${exp} decimal places for ${currency}; pass a rounding mode`,
    );
  }
  return divideRound(value, pow10(scale - exp), mode);
}

/** Minor units → canonical decimal string in major units ("-1234.50"). */
export function toMajorString(amount: bigint, currency: string): string {
  const exp = minorUnitExponent(currency);
  const negative = amount < 0n;
  const digits = abs(amount).toString().padStart(exp + 1, "0");
  const intPart = exp === 0 ? digits : digits.slice(0, -exp);
  const frac = exp === 0 ? "" : `.${digits.slice(-exp)}`;
  return `${negative ? "-" : ""}${intPart}${frac}`;
}

export function formatMoney(
  amount: bigint,
  currency: string,
  options: { locale?: string; display?: "symbol" | "code" | "narrowSymbol" } = {},
): string {
  const exp = minorUnitExponent(currency);
  const formatter = new Intl.NumberFormat(options.locale ?? "en-IN", {
    style: "currency",
    currency,
    currencyDisplay: options.display ?? "symbol",
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  });
  // Intl formats numeric strings as exact decimals (no float conversion).
  return formatter.format(toMajorString(amount, currency) as unknown as number);
}

export function money(amount: bigint, currency: string): Money {
  return { amount, currency: assertCurrency(currency) };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

export function sum(items: readonly Money[], currency: string): Money {
  return items.reduce((acc, m) => add(acc, m), money(0n, currency));
}

/** amount × numerator / denominator, rounded once at the end. */
export function multiplyRatio(
  amount: bigint,
  numerator: bigint,
  denominator: bigint,
  mode: RoundingMode = "HALF_UP",
): bigint {
  return divideRound(amount * numerator, denominator, mode);
}

/** amount × decimal factor ("1.18", "0.075"), rounded to minor units. */
export function multiplyDecimal(amount: bigint, factor: string, mode: RoundingMode = "HALF_UP"): bigint {
  const { value, scale } = parseDecimal(factor);
  return divideRound(amount * value, pow10(scale), mode);
}

/** percent given as a decimal string, e.g. percentOf(100000n, "12.5") = 12500n. */
export function percentOf(amount: bigint, percent: string, mode: RoundingMode = "HALF_UP"): bigint {
  const { value, scale } = parseDecimal(percent);
  return divideRound(amount * value, 100n * pow10(scale), mode);
}

/**
 * Converts between currencies using `rate` = units of `to` per 1 unit of `from`
 * (decimal string), accounting for different minor-unit exponents.
 */
export function convert(
  amount: bigint,
  from: string,
  to: string,
  rate: string,
  mode: RoundingMode = "HALF_UP",
): bigint {
  const fromExp = minorUnitExponent(from);
  const toExp = minorUnitExponent(to);
  const { value, scale } = parseDecimal(rate);
  if (value <= 0n) throw new MoneyError("Exchange rate must be positive");
  const numerator = amount * value * pow10(toExp);
  const denominator = pow10(scale) * pow10(fromExp);
  return divideRound(numerator, denominator, mode);
}

/**
 * Splits `amount` proportionally to integer `ratios` using the largest-remainder
 * method. The parts always sum exactly to `amount`.
 */
export function allocate(amount: bigint, ratios: readonly (bigint | number)[]): bigint[] {
  if (ratios.length === 0) throw new MoneyError("allocate() needs at least one ratio");
  const weights = ratios.map((r) => {
    if (typeof r === "number" && !Number.isInteger(r)) {
      throw new MoneyError("Ratios must be integers");
    }
    const w = BigInt(r);
    if (w < 0n) throw new MoneyError("Ratios must be non-negative");
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0n);
  if (total === 0n) throw new MoneyError("Ratios must not all be zero");

  const negative = amount < 0n;
  const absolute = abs(amount);
  const parts = weights.map((w) => (absolute * w) / total);
  const remainders = weights.map((w, i) => ({ i, r: (absolute * w) % total }));
  let leftover = absolute - parts.reduce((a, b) => a + b, 0n);
  remainders.sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  for (let k = 0; leftover > 0n; k++, leftover--) {
    parts[remainders[k % remainders.length].i] += 1n;
  }
  return negative ? parts.map((p) => -p) : parts;
}

export function splitEvenly(amount: bigint, parts: number): bigint[] {
  if (!Number.isInteger(parts) || parts <= 0) throw new MoneyError("parts must be a positive integer");
  return allocate(amount, Array.from({ length: parts }, () => 1));
}

/** bigint is not JSON-serialisable; use these at the server → client boundary. */
export function serializeMoney(m: Money): { amount: string; currency: string } {
  return { amount: m.amount.toString(), currency: m.currency };
}

export function parseMoney(m: { amount: string; currency: string }): Money {
  if (!/^-?\d+$/.test(m.amount)) throw new MoneyError(`Invalid minor-unit amount "${m.amount}"`);
  return money(BigInt(m.amount), m.currency);
}
