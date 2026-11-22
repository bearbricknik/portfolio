"use client";

import { usePathname } from "next/navigation";

import { isHiPath } from "@/lib/hi";

/**
 * Leaves out parts of the shared layout on /hi and /hi/* (header, footer,
 * corner controls, ⌘K hint, "hello" intro): the page stands on its own
 * there. Decided from the address while prerendering already, so nothing
 * flashes.
 */
export function HiddenOnHi({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isHiPath(pathname) ? null : children;
}
