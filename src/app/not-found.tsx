import { SearchX } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <Logo />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <EmptyState
          icon={SearchX}
          title="Page not found"
          description="This page doesn't exist, or you don't have access to it."
          action={
            <Button asChild>
              <Link href="/">Go to my workspace</Link>
            </Button>
          }
        />
      </main>
    </div>
  );
}
