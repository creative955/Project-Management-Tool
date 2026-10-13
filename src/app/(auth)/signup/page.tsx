import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { isGoogleEnabled } from "@/server/auth";
import { getSessionUser } from "@/server/tenancy/context";
import { SignupForm } from "../auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);
  if (await getSessionUser()) redirect(callbackUrl);
  return <SignupForm callbackUrl={callbackUrl} googleEnabled={isGoogleEnabled} />;
}
