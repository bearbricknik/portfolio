import { IconArrowUpRight } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";

import { cn } from "@/lib/utils";

type Icon = React.ComponentType<{ className?: string }>;

const badgeClassName =
  "inline-flex items-center gap-1 rounded-md border bg-muted/60 px-1.5 py-0.5 text-sm leading-none";

/** Inline badge with a colored icon, e.g. for a technology */
export function Badge({ icon: Icon, color, children }: { icon: Icon; color: string; children: React.ReactNode }) {
  return (
    <span className={badgeClassName}>
      <Icon className={cn("size-3.5", color)} />
      {children}
    </span>
  );
}

/**
 * Badge that links somewhere; the cursor shows `cursorLabel` on hover. Opens a
 * new tab with an ↗ arrow by default; pass `newTab={false}` for e.g. mailto links.
 */
export function ExternalBadge({
  href,
  icon: Icon,
  color,
  cursorLabel,
  newTab = true,
  children,
}: {
  href: string;
  icon: Icon;
  color: string;
  cursorLabel: string;
  newTab?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(newTab && { target: "_blank", rel: "noreferrer" })}
      data-cursor={cursorLabel}
      className={cn(badgeClassName, "transition-colors hover:bg-muted")}
    >
      <Icon className={cn("size-3.5", color)} />
      {children}
      {newTab && <IconArrowUpRight className="size-3 text-muted-foreground" />}
    </a>
  );
}
