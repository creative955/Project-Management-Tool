"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHORTCUTS, type ShortcutDef } from "@/config/shortcuts";
import { useShell } from "./shell-context";

const GROUPS: ShortcutDef["group"][] = ["General", "Navigation", "Appearance"];

function Keys({ def }: { def: ShortcutDef }) {
  return (
    <span className="flex items-center gap-1">
      {def.keys.map((k, i) => (
        <span key={`${k}-${i}`} className="flex items-center gap-1">
          {i > 0 ? <span className="text-xs text-muted-foreground">{def.sequence ? "then" : "+"}</span> : null}
          <kbd className="min-w-6 rounded border bg-muted px-1.5 py-0.5 text-center font-mono text-xs">
            {k === "Mod" ? "⌘/Ctrl" : k}
          </kbd>
        </span>
      ))}
    </span>
  );
}

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useShell();
  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Shortcuts are ignored while you are typing in a field.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {GROUPS.map((group) => (
            <section key={group}>
              <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group}</h3>
              <ul className="divide-y rounded-md border">
                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                    <span>{s.description}</span>
                    <Keys def={s} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
