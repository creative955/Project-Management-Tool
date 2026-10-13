export interface ShortcutDef {
  id: string;
  /** Display keys, e.g. ["Mod", "K"] or ["G", "H"] for a sequence. */
  keys: string[];
  sequence?: boolean;
  description: string;
  group: "General" | "Navigation" | "Appearance";
}

export const SHORTCUTS: ShortcutDef[] = [
  { id: "palette", keys: ["Mod", "K"], description: "Open command palette / search", group: "General" },
  { id: "search", keys: ["/"], description: "Search", group: "General" },
  { id: "quick-create", keys: ["Q"], description: "Quick create", group: "General" },
  { id: "help", keys: ["?"], description: "Show keyboard shortcuts", group: "General" },
  { id: "sidebar", keys: ["["], description: "Collapse / expand sidebar", group: "Appearance" },
  { id: "theme", keys: ["Shift", "T"], description: "Toggle dark mode", group: "Appearance" },
  { id: "density", keys: ["Shift", "D"], description: "Toggle compact density", group: "Appearance" },
  { id: "go-home", keys: ["G", "H"], sequence: true, description: "Go to Home", group: "Navigation" },
  { id: "go-inbox", keys: ["G", "I"], sequence: true, description: "Go to Inbox", group: "Navigation" },
  { id: "go-everything", keys: ["G", "E"], sequence: true, description: "Go to Everything", group: "Navigation" },
  { id: "go-settings", keys: ["G", "S"], sequence: true, description: "Go to Settings", group: "Navigation" },
];
