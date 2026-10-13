"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { acceptInvitation, InvitationError } from "@/server/modules/org/invitations";
import { getSessionUser } from "@/server/tenancy/context";

export async function acceptInvitationAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const token = String(formData.get("token") ?? "");
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);

  let orgSlug: string;
  try {
    ({ orgSlug } = await prisma.$transaction((tx) =>
      acceptInvitation(tx, { token, userId: user.id, userEmail: user.email }),
    ));
  } catch (error) {
    if (error instanceof InvitationError) return { error: error.message };
    throw error;
  }
  redirect(`/w/${orgSlug}/home`);
}
