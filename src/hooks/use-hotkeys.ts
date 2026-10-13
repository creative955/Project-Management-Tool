"use client";

import { useEffect, useRef } from "react";

/**
 * Binding keys: "mod+k", "shift+t", "/", "?", "[", or a two-key sequence "g h".
 * Bindings are ignored while typing in inputs, except those using "mod".
 */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

const SEQUENCE_TIMEOUT_MS = 900;

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function normalizeKey(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  // Shifted symbols ("?") already encode shift; only add it for letters.
  if (event.shiftKey && /^[a-z]$/.test(key)) parts.push("shift");
  parts.push(key);
  return parts.join("+");
}

export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const mapRef = useRef(map);
  mapRef.current = map;
  const pending = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      const combo = normalizeKey(event);
      const bindings = mapRef.current;
      const editable = isEditableTarget(event.target);
      if (editable && !combo.startsWith("mod+")) return;

      const prev = pending.current;
      if (prev && Date.now() - prev.at < SEQUENCE_TIMEOUT_MS) {
        const handler = bindings[`${prev.key} ${combo}`];
        pending.current = null;
        if (handler) {
          event.preventDefault();
          handler(event);
          return;
        }
      }

      const isSequenceStart = Object.keys(bindings).some((k) => k.startsWith(`${combo} `));
      if (isSequenceStart) {
        pending.current = { key: combo, at: Date.now() };
        return;
      }

      const handler = bindings[combo];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
