import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-[13px] font-bold text-brand dark:bg-brand dark:text-ink",
        className,
      )}
    >
      {APP_NAME.slice(0, 1)}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>{APP_NAME}</span>
    </span>
  );
}
