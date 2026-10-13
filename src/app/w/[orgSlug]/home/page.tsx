import { ArrowRight, Building2, Check, Command, Home as HomeIcon, MailPlus, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_PHASE } from "@/config/navigation";
import { ROADMAP } from "@/config/roadmap";
import { getHomeData } from "@/server/modules/org/queries";
import { MODULES, MODULE_LABELS, SCOPE_LABELS } from "@/server/rbac/catalog";
import { can, getScope } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

function greeting(timezone: string): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Stat({ icon: Icon, label, value, href }: { icon: typeof Users; label: string; value: number; href?: string }) {
  const body = (
    <Card className="gap-2 py-4 transition-colors hover:border-foreground/20">
      <CardContent className="flex items-center gap-3 px-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

type Person = { id: string; title: string | null; user: { name: string | null; email: string; image: string | null } };

function PeopleList({ people, empty }: { people: Person[]; empty: string }) {
  if (people.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {people.map((p) => (
        <li key={p.id} className="flex min-w-0 items-center gap-2">
          <UserAvatar name={p.user.name} email={p.user.email} image={p.user.image} />
          <span className="min-w-0">
            <span className="block truncate text-sm">{p.user.name ?? p.user.email}</span>
            <span className="block truncate text-xs text-muted-foreground">{p.title ?? "—"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function HomePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const ctx = await getOrgContext((await params).orgSlug);
  const data = await getHomeData(ctx);
  const isAdmin = can(ctx.actor, "admin", "view");
  const base = `/w/${ctx.org.slug}`;
  const firstName = ctx.user.name?.split(" ")[0] ?? "there";
  const access = MODULES.map((m) => ({ module: m, scope: getScope(ctx.actor.permissions, m, "view") })).filter(
    (a) => a.scope !== "NONE",
  );

  return (
    <>
      <PageHeader
        icon={HomeIcon}
        title={`${greeting(ctx.org.timezone)}, ${firstName}`}
        description={`${ctx.role.name} at ${ctx.org.name}${data.department ? ` · ${data.department.name}` : ""}`}
        actions={
          isAdmin ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`${base}/settings/members?invite=1`}>
                <MailPlus /> Invite people
              </Link>
            </Button>
          ) : null
        }
      />
      <PageBody className="space-y-5">
        <section aria-label="Workspace at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Active members" value={data.memberCount} href={isAdmin ? `${base}/settings/members` : undefined} />
          <Stat icon={Building2} label="Departments" value={data.departmentCount} />
          <Stat icon={MapPin} label="Locations" value={data.locationCount} />
          <Stat icon={MailPlus} label="Pending invitations" value={data.pendingInvites} href={isAdmin ? `${base}/settings/members` : undefined} />
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your team</CardTitle>
                <CardDescription>
                  {data.manager
                    ? `You report to ${data.manager.user.name ?? data.manager.user.email}${data.manager.title ? ` (${data.manager.title})` : ""}.`
                    : "You don't have a reporting manager set."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Reports to you ({data.reports.length})
                  </h3>
                  <PeopleList people={data.reports} empty="Nobody reports to you directly." />
                </div>
                {data.department ? (
                  <div>
                    <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {data.department.name}
                    </h3>
                    <PeopleList people={data.departmentPeers} empty="You're the only one in this department so far." />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build roadmap</CardTitle>
                <CardDescription>Modules light up in the sidebar as each phase ships.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-2 sm:grid-cols-2">
                  {ROADMAP.map((p) => {
                    const done = p.phase <= CURRENT_PHASE;
                    return (
                      <li key={p.phase} className={cn("flex gap-3 rounded-lg border p-3", done && "border-foreground/20 bg-muted/50")}>
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                            done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                          aria-label={done ? "Shipped" : "Planned"}
                        >
                          {done ? <Check className="size-3.5" /> : p.phase}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            Phase {p.phase} · {p.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">{p.summary}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Your access</CardTitle>
                <CardDescription>What the {ctx.role.name} role can view.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {access.map((a) => (
                    <li key={a.module} className="flex items-center justify-between py-2">
                      <span>{MODULE_LABELS[a.module]}</span>
                      <Badge variant="secondary">{SCOPE_LABELS[a.scope]}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Work faster</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <Command className="size-4" aria-hidden /> Press{" "}
                  <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">⌘K</kbd> to search and jump anywhere.
                </p>
                <p className="text-muted-foreground">
                  Press <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">?</kbd> for every keyboard shortcut.
                </p>
                {isAdmin ? (
                  <Link href={`${base}/settings`} className="inline-flex items-center gap-1 font-medium underline underline-offset-4">
                    Configure workspace <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
