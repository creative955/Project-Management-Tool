import type { Metadata } from "next";
import { can } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";
import { GeneralSettingsForm, type GeneralSettingsValues } from "./general-form";

export const metadata: Metadata = { title: "Settings" };

export default async function GeneralSettingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const ctx = await getOrgContext((await params).orgSlug);
  const o = ctx.org;
  return (
    <GeneralSettingsForm
      key={o.updatedAt.toISOString()}
      orgSlug={o.slug}
      canEdit={can(ctx.actor, "admin", "edit")}
      initial={{
        name: o.name,
        country: o.country,
        baseCurrency: o.baseCurrency as GeneralSettingsValues["baseCurrency"],
        timezone: o.timezone as GeneralSettingsValues["timezone"],
        fiscalYearStartMonth: o.fiscalYearStartMonth,
        weekStartsOn: o.weekStartsOn,
        workingDays: [...o.workingDays].sort((a, b) => a - b),
        workdayStartMinutes: o.workdayStartMinutes,
        workdayEndMinutes: o.workdayEndMinutes,
      }}
    />
  );
}
