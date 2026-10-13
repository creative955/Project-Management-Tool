import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { isGoogleEnabled } from "@/server/auth";
import { getSessionUser } from "@/server/tenancy/context";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Sign in" };

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  AccessDenied: "Access was denied.",
  Configuration: "Sign-in is not configured correctly. Contact your administrator.",
};

const DEMO_LOGINS = [
  { role: "Owner", email: "aarav@northlight.studio" },
  { role: "HR Manager", email: "meera@northlight.studio" },
  { role: "Finance Manager", email: "rohan@northlight.studio" },
  { role: "Employee", email: "ishaan@northlight.studio" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (await getSessionUser()) redirect(callbackUrl);

  const showDemo = process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGINS === "true";

  return (
    <>
      <LoginForm
        callbackUrl={callbackUrl}
        googleEnabled={isGoogleEnabled}
        initialError={params.error ? (AUTH_ERRORS[params.error] ?? "Sign-in failed. Please try again.") : undefined}
      />
      {showDemo ? (
        <section aria-label="Demo accounts" className="mt-8 rounded-lg border bg-card p-4 text-xs">
          <p className="font-medium">Demo workspace (seeded)</p>
          <p className="mt-0.5 text-muted-foreground">
            Password for every demo account: <code className="font-mono text-foreground">Northlight@2026</code>
          </p>
          <ul className="mt-2 space-y-1">
            {DEMO_LOGINS.map((d) => (
              <li key={d.email} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{d.role}</span>
                <code className="font-mono">{d.email}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
