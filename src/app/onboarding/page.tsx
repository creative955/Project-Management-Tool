import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/common/logo";
import { requireUser } from "@/server/tenancy/context";
import { listUserWorkspaces } from "@/server/tenancy/resolve";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Create workspace" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const user = await requireUser();
  const workspaces = await listUserWorkspaces(user.id);
  const creatingAnother = (await searchParams).new === "1";
  if (workspaces.length > 0 && !creatingAnother) redirect(`/w/${workspaces[0].slug}/home`);

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <Logo />
        {workspaces.length > 0 ? (
          <Link href={`/w/${workspaces[0].slug}/home`} className="text-sm text-muted-foreground underline underline-offset-4">
            Back to {workspaces[0].name}
          </Link>
        ) : null}
      </div>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {creatingAnother ? "Create another workspace" : `Welcome${firstName ? `, ${firstName}` : ""}`}
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          A workspace holds your projects, clients, people and books. You&apos;ll be its owner.
        </p>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <OnboardingForm defaultName={creatingAnother ? "" : user.name ? `${firstName}'s team` : ""} />
        </div>
      </main>
    </div>
  );
}
