import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b px-[var(--page-padding)] pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 px-[var(--page-padding)] py-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
        <Skeleton className="h-64 rounded-xl sm:col-span-2 xl:col-span-3" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
