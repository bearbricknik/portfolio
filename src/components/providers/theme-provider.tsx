"use client";

import { useEffectEvent, useLayoutEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

// next-themes' default localStorage key
const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

/**
 * Each language has its own root layout, and Next.js keeps the one you left
 * alive in the background (with its state) to show it again instantly. Two
 * things go wrong on a language switch without this:
 * - that tree's theme state is from before: the theme picked in the other
 *   language must win, so the stored choice is read again
 * - React resets <html>'s classes to the server's (no theme class), and
 *   next-themes only sets it again after a frame has been painted: a flash
 *   of the wrong theme
 * Layout effects run again whenever the tree is shown, before the browser
 * paints, so both are put right in the same frame.
 */
function ThemeSync() {
  const { theme, setTheme } = useTheme();

  const sync = useEffectEvent(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    const active = stored ?? theme;
    if (active === "light" || active === "dark") {
      const root = document.documentElement.classList;
      root.toggle("dark", active === "dark");
      root.toggle("light", active === "light");
    }
    if (stored && stored !== theme) setTheme(stored);
  });

  useLayoutEffect(() => sync(), []);

  return null;
}
