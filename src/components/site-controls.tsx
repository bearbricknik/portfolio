import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

/**
 * Language and theme, side by side. In the top right corner of the layout from
 * `sm` on; on phones next to the navigation in the header instead.
 */
export function SiteControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <LocaleSwitcher />
      <ThemeSwitcher />
    </div>
  );
}
