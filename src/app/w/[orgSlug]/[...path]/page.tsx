import { Construction } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBody, PageHeader } from "@/components/common/page-header";
import { EmptyState, ForbiddenState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { CURRENT_PHASE, findNavItem } from "@/config/navigation";
import { roadmapPhase } from "@/config/roadmap";
import { can } from "@/server/rbac/check";
import { getOrgContext } from "@/server/tenancy/context";

type Params = Promise<{ orgSlug: string; path: string[] }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = findNavItem((await params).path.join("/"));
  return { title: item?.title ?? "Not found" };
}

/** Landing page for modules that are planned but not yet built. */
export default async function ModuleLandingPage({ params }: { params: Params }) {
  const { orgSlug, path } = await params;
  const item = findNavItem(path.join("/"));
  if (!item || item.phase <= CURRENT_PHASE) notFound();

  const ctx = await getOrgContext(orgSlug);
  const phase = roadmapPhase(item.phase);

  return (
    <>
      <PageHeader icon={item.icon} title={item.title} description={item.description} />
      <PageBody>
        {item.module && !can(ctx.actor, item.module, "view") ? (
          <ForbiddenState />
        ) : (
          <EmptyState
            icon={Construction}
            title={`${item.title} arrives in phase ${item.phase}`}
            description={
              <>
                {item.description}
                {phase ? (
                  <span className="mt-2 block">
                    Phase {phase.phase} · {phase.title}: {phase.summary}
                  </span>
                ) : null}
              </>
            }
            action={
              <Button asChild>
                <Link href={`/w/${orgSlug}/home`}>Back to Home</Link>
              </Button>
            }
          />
        )}
      </PageBody>
    </>
  );
}
