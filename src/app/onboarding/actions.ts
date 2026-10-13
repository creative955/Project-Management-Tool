"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { createOrganization } from "@/server/modules/org/bootstrap";
import { createWorkspaceSchema } from "@/server/modules/org/schemas";
import { getSessionUser } from "@/server/tenancy/context";

export interface OnboardingState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createWorkspaceAction(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/onboarding");

  const parsed = createWorkspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const taken = await prisma.organization.findUnique({ where: { slug: parsed.data.slug } });
  if (taken) return { fieldErrors: { slug: ["This URL is already taken"] } };

  const { org } = await prisma.$transaction((tx) =>
    createOrganization(tx, { ...parsed.data, ownerUserId: user.id }),
  );
  redirect(`/w/${org.slug}/home`);
}
