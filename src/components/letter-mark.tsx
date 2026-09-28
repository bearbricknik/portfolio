import { cn } from "@/lib/utils";

type LetterMarkProps = {
  /** One or two letters, e.g. "TS" */
  label: string;
  /** Text color class; the fill and border are tinted from it */
  color: string;
  /** `md` next to a name, `sm` inside a small link chip */
  size?: "sm" | "md";
  className?: string;
};

/**
 * Letters in a small rounded square, tinted in a color: the mark for tools and
 * projects. One consistent style instead of mixed third-party logos.
 */
export function LetterMark({ label, color, size = "md", className }: LetterMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center border border-current/30 bg-current/12 leading-none font-semibold tracking-tight",
        size === "md" ? "size-5.5 rounded-sm text-[10.5px]" : "size-3.5 rounded-[3px] text-[7.5px]",
        color,
        className,
      )}
    >
      {label}
    </span>
  );
}
