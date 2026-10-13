import { Settings } from "lucide-react";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { ForbiddenState } from "@/components/common/states";
import { can } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const ctx = await getOrgContext((await params).orgSlug);
  if (!can(ctx.actor, "admin", "view")) {
    return (
      <>
        <PageHeader icon={Settings} title="Settings" />
        <PageBody>
          <ForbiddenState description="Only workspace owners and admins can open settings." />
        </PageBody>
      </>
    );
  }
  return (
    <>
      <PageHeader icon={Settings} title="Settings" description={`Manage ${ctx.org.name}`}>
        <SettingsTabs orgSlug={ctx.org.slug} />
      </PageHeader>
      <PageBody>{children}</PageBody>
    </>
  );
}
