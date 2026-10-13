import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[a-z]/i, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
