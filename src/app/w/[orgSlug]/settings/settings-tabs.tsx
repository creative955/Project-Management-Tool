"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SettingsTabs({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections" className="-mb-px flex gap-1 overflow-x-auto px-[var(--page-padding)]">
      {SETTINGS_NAV.map((item) => {
        const href = `/w/${orgSlug}${item.href}`;
        const active = item.href === "/settings" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 border-b-2 px-2 text-sm whitespace-nowrap",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
