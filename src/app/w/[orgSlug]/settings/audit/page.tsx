import { History } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/states";
import { getRecentAudit } from "@/server/modules/org/queries";
import { getOrgContext } from "@/server/tenancy/context";

export const metadata: Metadata = { title: "Audit log" };

const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default async function AuditPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const ctx = await getOrgContext((await params).orgSlug);
  const entries = await getRecentAudit(ctx, 100);

  if (entries.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="Changes made in this workspace will be recorded here." />;
  }

  return (
    <section aria-labelledby="audit-heading" className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 id="audit-heading" className="text-base font-semibold">
          Recent activity
        </h2>
        <p className="text-sm text-muted-foreground">
          Latest 100 changes. Filtering and export arrive with the full audit viewer in phase 12.
        </p>
      </div>
      <ol className="divide-y">
        {entries.map((e) => {
          const changes = (e.changes ?? {}) as Record<string, { from: unknown; to: unknown }>;
          const keys = Object.keys(changes);
          return (
            <li key={e.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[11rem_1fr]">
              <time dateTime={e.createdAt.toISOString()} className="text-xs text-muted-foreground">
                {fmt.format(e.createdAt)}
              </time>
              <div className="min-w-0">
                <p>
                  <span className="font-medium">{e.actor?.name ?? e.actor?.email ?? "System"}</span>{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{e.action}</code>{" "}
                  <span className="text-muted-foreground">on {e.entityType}</span>
                </p>
                {keys.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {keys.map((k) => (
                      <li key={k} className="truncate">
                        <span className="text-foreground">{k}</span>: {renderValue(changes[k].from)} → {renderValue(changes[k].to)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
