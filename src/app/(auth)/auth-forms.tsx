"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { googleSignInAction, loginAction, signupAction, type AuthFormState } from "./actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form action={googleSignInAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" variant="outline" className="w-full">
        <svg aria-hidden viewBox="0 0 24 24" className="size-4">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </Button>
    </form>
  );
}

function Divider() {
  return (
    <div className="relative my-5 text-center text-xs text-muted-foreground">
      <span className="relative z-10 bg-background px-2">or continue with email</span>
      <span aria-hidden className="absolute inset-x-0 top-1/2 border-t" />
    </div>
  );
}

const initial: AuthFormState = {};

export function LoginForm({
  callbackUrl,
  googleEnabled,
  initialError,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  initialError?: string;
}) {
  const [state, action] = useActionState(loginAction, initial);
  const signupHref = `/signup${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace.</p>
      <div className="mt-6">
        {googleEnabled ? (
          <>
            <GoogleButton callbackUrl={callbackUrl} />
            <Divider />
          </>
        ) : null}
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <FormError message={state.error ?? initialError} />
          <FormField id="email" label="Work email" error={state.fieldErrors?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.values?.email}
              aria-invalid={Boolean(state.fieldErrors?.email)}
            />
          </FormField>
          <FormField id="password" label="Password" error={state.fieldErrors?.password}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(state.fieldErrors?.password)}
            />
          </FormField>
          <SubmitButton>Sign in</SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href={signupHref} className="font-medium text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export function SignupForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const [state, action] = useActionState(signupAction, initial);
  const loginHref = `/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Set up a workspace for your team in a minute.</p>
      <div className="mt-6">
        {googleEnabled ? (
          <>
            <GoogleButton callbackUrl={callbackUrl === "/" ? "/onboarding" : callbackUrl} />
            <Divider />
          </>
        ) : null}
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="callbackUrl" value={callbackUrl === "/" ? "" : callbackUrl} />
          <FormError message={state.error} />
          <FormField id="name" label="Full name" error={state.fieldErrors?.name}>
            <Input id="name" name="name" autoComplete="name" required defaultValue={state.values?.name} aria-invalid={Boolean(state.fieldErrors?.name)} />
          </FormField>
          <FormField id="email" label="Work email" error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} aria-invalid={Boolean(state.fieldErrors?.email)} />
          </FormField>
          <FormField
            id="password"
            label="Password"
            error={state.fieldErrors?.password}
            hint="At least 10 characters, with a letter and a number."
          >
            <Input id="password" name="password" type="password" autoComplete="new-password" required aria-invalid={Boolean(state.fieldErrors?.password)} />
          </FormField>
          <SubmitButton>Create account</SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
