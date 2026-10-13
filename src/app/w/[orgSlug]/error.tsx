"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";

export default function OrgError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-[var(--page-padding)]">
      <ErrorState
        description={
          <>
            We couldn&apos;t load this page. Please try again.
            {error.digest ? <span className="mt-1 block font-mono text-xs">Reference: {error.digest}</span> : null}
          </>
        }
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
