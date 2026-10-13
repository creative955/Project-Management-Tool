import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { MODULES } from "@/server/rbac/catalog";
import { can } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";
import { listUserWorkspaces } from "@/server/tenancy/resolve";

type Params = Promise<{ orgSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ctx = await getOrgContext((await params).orgSlug);
  return { title: { default: ctx.org.name, template: `%s · ${ctx.org.name}` } };
}

export default async function OrgLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const ctx = await getOrgContext((await params).orgSlug);
  const workspaces = await listUserWorkspaces(ctx.user.id);

  return (
    <AppShell
      state={{
        org: { id: ctx.org.id, name: ctx.org.name, slug: ctx.org.slug, logoUrl: ctx.org.logoUrl },
        roleName: ctx.role.name,
        user: ctx.user,
        workspaces,
        modules: MODULES.filter((m) => can(ctx.actor, m, "view")),
        creatableModules: MODULES.filter((m) => can(ctx.actor, m, "create")),
      }}
    >
      {children}
    </AppShell>
  );
}
