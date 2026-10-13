import { Logo } from "@/components/common/logo";
import { APP_NAME, APP_TAGLINE } from "@/config/app";

const HIGHLIGHTS = [
  "Spaces, lists and tasks with board, table, Gantt and workload views",
  "CRM pipeline from lead to signed quote to project",
  "Leave, attendance and payroll with ledger-accurate balances",
  "Double-entry books, invoicing and bank reconciliation",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-[#F2F3EF] lg:flex lg:flex-col lg:justify-end">
        <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative max-w-md">
          <p className="mb-3 inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold text-ink">
            {APP_NAME}
          </p>
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">{APP_TAGLINE}</h2>
          <ul className="mt-8 space-y-3 text-sm text-[#C9CCC4]">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex gap-3">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
