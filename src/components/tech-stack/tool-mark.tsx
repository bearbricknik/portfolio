import { cn } from "@/lib/utils";

type ToolMarkProps = {
  /** One or two letters, e.g. "TS" */
  label: string;
  /** Text color class; the fill and border are tinted from it */
  color: string;
  className?: string;
};

/**
 * A tool's mark: its letters in a small rounded square, tinted in its color.
 * One consistent style for every tool instead of mixed third-party logos.
 */
export function ToolMark({ label, color, className }: ToolMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5.5 shrink-0 place-items-center rounded-sm border border-current/30 bg-current/12 text-[10.5px] leading-none font-semibold tracking-tight",
        color,
        className,
      )}
    >
      {label}
    </span>
  );
}
