import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Plain tag next to link chips, e.g. a platform ("iOS"): dashed and muted, so
 * it doesn't look clickable
 */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-md border border-dashed px-2 py-1 text-xs leading-none text-muted-foreground", className)}>
      {children}
    </span>
  );
}
