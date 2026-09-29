"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useTranslations } from "next-intl";

import { HandwrittenNote } from "@/components/handwritten-note";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

// ⌘K on macOS, Ctrl+K on Windows/Linux ("Mod" resolves per platform)
const HOTKEY = "Mod+K";
const TARGET = "/about-me";

const subscribe = () => () => {};

/**
 * Key labels for the visitor's platform, e.g. "⌘ K" or "Ctrl K". Only known in
 * the browser: the server renders nothing (it would guess "linux" → "Ctrl").
 * Also nothing on touch-only devices, where there is no keyboard to press it.
 */
function useHotkeyKeys() {
  const keys = useSyncExternalStore(
    subscribe,
    () =>
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ? formatForDisplay(HOTKEY, { parts: true }).join(" ")
        : null,
    () => null,
  );
  return keys?.split(" ") ?? null;
}

/** Keyboard hint in the bottom right corner; pressing it opens /about-me */
export function CommandHint({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("Controls");
  const keys = useHotkeyKeys();

  useHotkey(HOTKEY, () => router.push(TARGET), { requireReset: true });

  if (!keys) return null;

  return (
    // Hidden below sm (phones); the note and the keys share one positioned box
    <div className={cn("hidden items-end sm:flex", className)}>
      {/* Handwritten "get to know me" with an arrow pointing at the keys */}
      <HandwrittenNote
        arrow="right"
        arrowPosition="below"
        waitForStreams
        delay={1}
        tilt={-4}
        // bottom-0: the arrow tip (~11px above the note's bottom) meets the middle of the 20px keys
        className="pointer-events-none absolute right-full bottom-0 mr-1 whitespace-nowrap"
      >
        {t("getToKnowMe")}
      </HandwrittenNote>
      <Link
        href={TARGET}
        aria-label={t("aboutMe")}
        aria-keyshortcuts={HOTKEY.replace("Mod", keys[0] === "⌘" ? "Meta" : "Control")}
        // A flex box of exactly the Kbd height
        className="flex rounded-md opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        <KbdGroup>
          {keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </Link>
    </div>
  );
}
