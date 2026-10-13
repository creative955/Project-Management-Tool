import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  /** Usually a <ViewsBar />. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b bg-background", className)}>
      <div className="flex flex-col gap-3 px-[var(--page-padding)] pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-4" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {description ? <p className="truncate text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-[var(--page-padding)] py-5", className)}>{children}</div>;
}
