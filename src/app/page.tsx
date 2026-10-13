import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_LAST_ORG } from "@/config/app";
import { getSessionUser } from "@/server/tenancy/context";
import { listUserWorkspaces } from "@/server/tenancy/resolve";

export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const workspaces = await listUserWorkspaces(user.id);
  if (workspaces.length === 0) redirect("/onboarding");

  const last = (await cookies()).get(COOKIE_LAST_ORG)?.value;
  const target = workspaces.find((w) => w.slug === last) ?? workspaces[0];
  redirect(`/w/${target.slug}/home`);
}
