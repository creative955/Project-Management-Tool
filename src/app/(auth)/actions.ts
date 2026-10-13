"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { signIn } from "@/server/auth";
import { hashPassword, passwordSchema } from "@/server/auth/password";
import { prisma } from "@/server/db";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: { name?: string; email?: string };
}

const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, "Enter your password"),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase().trim()),
  password: passwordSchema,
});

/**
 * Signs in without letting Auth.js build an absolute redirect URL: behind a proxy
 * the server's host can differ from the browser's, so we redirect to a relative
 * path ourselves once the session cookie is set.
 */
async function signInWithPassword(email: string, password: string): Promise<"ok" | "invalid" | "error"> {
  try {
    const url = await signIn("credentials", { email, password, redirect: false });
    if (typeof url === "string" && url.includes("error=")) {
      return url.includes("CredentialsSignin") ? "invalid" : "error";
    }
    return "ok";
  } catch (error) {
    if (error instanceof AuthError) return error.type === "CredentialsSignin" ? "invalid" : "error";
    throw error;
  }
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);
  const values = { email: String(raw.email ?? "") };
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const result = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (result !== "ok") {
    return {
      error: result === "invalid" ? "Incorrect email or password." : "Sign-in failed. Please try again.",
      values,
    };
  }
  redirect(safeCallbackUrl(raw.callbackUrl));
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData);
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? "") };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists. Sign in instead."] }, values };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  const result = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (result !== "ok") return { error: "Account created, but sign-in failed. Please log in.", values };
  redirect(safeCallbackUrl(raw.callbackUrl, "/onboarding"));
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: safeCallbackUrl(formData.get("callbackUrl")) });
}
