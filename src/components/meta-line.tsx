import { Children, Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetaLineProps = {
  /** The parts, e.g. category, date and reading time; empty ones are skipped */
  children: ReactNode;
  className?: string;
};

/**
 * A row of short facts (a post's category, date and reading time; the role
 * under the name), set apart by a thin vertical line instead of a dot.
 */
export function MetaLine({ children, className }: MetaLineProps) {
  const parts = Children.toArray(children);

  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground", className)}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <span aria-hidden className="h-[0.9em] w-px rounded-full bg-current opacity-25" />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}
