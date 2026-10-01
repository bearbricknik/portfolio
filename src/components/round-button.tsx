import type { ComponentType } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

type RoundButtonProps = {
  icon: Icon;
  /** Accessible name and cursor label, e.g. "Mehr zu ProfitPath" */
  label: string;
  /** Classes for the icon's hover motion, e.g. "group-hover/round:rotate-45" */
  iconClassName?: string;
  className?: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/**
 * Small round button with one icon: outlined, filled on hover. A link with
 * `href`, a button with `onClick` (e.g. "more" on a project, "back" on a post).
 */
export function RoundButton({ icon: Icon, label, iconClassName, className, ...action }: RoundButtonProps) {
  const classes = cn(
    "group/round grid size-6.5 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background",
    className,
  );
  const icon = (
    <Icon
      aria-hidden
      className={cn("size-3 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]", iconClassName)}
    />
  );
  // Label next to the pointing hand of the site's cursor
  const cursor = { "data-cursor": label, "data-cursor-pointer": true };

  return "href" in action && action.href ? (
    <Link href={action.href} aria-label={label} className={classes} {...cursor}>
      {icon}
    </Link>
  ) : (
    <button type="button" onClick={action.onClick} aria-label={label} className={classes} {...cursor}>
      {icon}
    </button>
  );
}
