import { MailWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/auth/actions";
import { prisma } from "@/server/db";
import { findInvitation } from "@/server/modules/org/invitations";
import { getSessionUser } from "@/server/tenancy/context";
import { AcceptInviteForm } from "./accept-form";

export const metadata: Metadata = { title: "Join workspace" };

const STATUS_COPY = {
  invalid: "This invitation link isn't valid. Ask your admin for a new one.",
  expired: "This invitation has expired. Ask your admin to send a new one.",
  revoked: "This invitation was revoked by an admin.",
  accepted: "This invitation has already been used.",
} as const;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [{ invitation, status }, user] = await Promise.all([findInvitation(prisma, token), getSessionUser()]);
  const callback = encodeURIComponent(`/invite/${token}`);

  let body: React.ReactNode;
  if (!invitation || status !== "valid") {
    body = (
      <EmptyState
        icon={MailWarning}
        title="Invitation unavailable"
        description={STATUS_COPY[status as keyof typeof STATUS_COPY]}
        action={
          <Button asChild variant="outline">
            <Link href="/">Go to your workspaces</Link>
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">You&apos;ve been invited to join</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{invitation.org.name}</h1>
        <p className="mt-2 text-sm">
          as <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{invitation.role.name}</span>
        </p>
        <div className="mt-6">
          {!user ? (
            <div className="grid gap-2">
              <Button asChild>
                <Link href={`/signup?callbackUrl=${callback}`}>Create an account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/login?callbackUrl=${callback}`}>I already have an account</Link>
              </Button>
              <p className="text-xs text-muted-foreground">Use {invitation.email} to accept this invitation.</p>
            </div>
          ) : user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
            <div className="space-y-3 text-sm">
              <p role="alert">
                This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re signed in as{" "}
                <strong>{user.email}</strong>.
              </p>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" className="w-full">
                  Sign out and switch account
                </Button>
              </form>
            </div>
          ) : (
            <AcceptInviteForm token={token} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <Logo />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{body}</main>
    </div>
  );
}
