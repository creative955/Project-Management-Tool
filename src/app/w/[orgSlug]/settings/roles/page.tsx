import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getRolesPageData } from "@/server/modules/org/queries";
import {
  ACTIONS,
  FIELD_GROUPS,
  FIELD_GROUP_LABELS,
  MODULES,
  MODULE_LABELS,
  SCOPE_LABELS,
  type Scope,
} from "@/server/rbac/catalog";
import { getScope } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";
import { toFieldAccessMap, toPermissionMap } from "@/server/tenancy/resolve";

export const metadata: Metadata = { title: "Roles & permissions" };

const SCOPE_STYLES: Record<Scope, string> = {
  NONE: "text-muted-foreground",
  OWN: "bg-muted",
  TEAM: "bg-secondary",
  DEPARTMENT: "bg-accent",
  ALL: "bg-primary text-primary-foreground",
};

export default async function RolesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const [{ orgSlug }, sp] = await Promise.all([params, searchParams]);
  const ctx = await getOrgContext(orgSlug);
  const roles = await getRolesPageData(ctx);
  const selected = roles.find((r) => r.key === sp.role) ?? roles[0];
  const permissions = toPermissionMap(selected?.permissions ?? []);
  const fieldAccess = toFieldAccessMap(selected?.fieldAccess ?? []);

  return (
    <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
      <nav aria-label="Roles" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {roles.map((r) => (
          <Link
            key={r.id}
            href={`/w/${ctx.org.slug}/settings/roles?role=${r.key}`}
            aria-current={r.id === selected?.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
              r.id === selected?.id ? "border-foreground bg-card font-medium" : "hover:bg-accent",
            )}
          >
            <span className="flex items-center gap-1.5">
              {r.isLocked ? <Lock className="size-3.5" aria-label="Locked" /> : null}
              {r.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{r._count.members}</span>
          </Link>
        ))}
      </nav>

      {selected ? (
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selected.name}
                {selected.isSystem ? <Badge variant="secondary">System role</Badge> : null}
              </CardTitle>
              <CardDescription>
                {selected.description} Editing roles and creating custom roles arrives in phase 12.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {ACTIONS.map((a) => (
                        <TableHead key={a} className="text-center capitalize">
                          {a}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((m) => (
                      <TableRow key={m}>
                        <TableCell className="font-medium whitespace-nowrap">{MODULE_LABELS[m]}</TableCell>
                        {ACTIONS.map((a) => {
                          const scope = getScope(permissions, m, a);
                          return (
                            <TableCell key={a} className="text-center">
                              <span className={cn("inline-block min-w-16 rounded px-1.5 py-0.5 text-xs", SCOPE_STYLES[scope])}>
                                {scope === "NONE" ? "—" : SCOPE_LABELS[scope]}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Own = records they own or are assigned to · Team = plus everyone reporting to them · Department = plus their
                department · All = the whole workspace.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sensitive fields</CardTitle>
              <CardDescription>Applies to other people&apos;s records. Everyone can always view their own.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {FIELD_GROUPS.map((g) => (
                  <li key={g} className="flex items-center justify-between py-2">
                    <span>{FIELD_GROUP_LABELS[g]}</span>
                    <Badge variant="outline" className="capitalize">
                      {(fieldAccess[g] ?? "HIDDEN").toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
