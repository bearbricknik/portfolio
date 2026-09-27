import { cn } from "@/lib/utils";

/**
 * A small car seen from above, pointing up (north): rotate it to the driving
 * direction. Colors follow the theme. Used on the /locations map and the CV route.
 */
export function CarIcon({ className }: { className?: string }) {
  return (
    <svg width="11" height="20" viewBox="0 0 14 26" fill="none" className={cn("drop-shadow-md", className)} aria-hidden>
      {/* Body */}
      <rect x="1" y="1" width="12" height="24" rx="4.5" className="fill-foreground" />
      {/* Windshield and rear window */}
      <path d="M3 8.2c0-.8.6-1.4 1.4-1.3 1.7.2 3.5.2 5.2 0 .8-.1 1.4.5 1.4 1.3v1.4c0 .5-.4.9-.9.9H3.9a.9.9 0 0 1-.9-.9V8.2Z" className="fill-background" />
      <path d="M3.4 18.4c0-.5.4-.8.9-.8h5.4c.5 0 .9.3.9.8v.8c0 .7-.6 1.2-1.3 1.1-1.5-.2-3.1-.2-4.6 0-.7.1-1.3-.4-1.3-1.1v-.8Z" className="fill-background" />
      {/* Roof */}
      <rect x="3.6" y="11.2" width="6.8" height="5.6" rx="1.2" className="fill-foreground stroke-background/25" strokeWidth="0.5" />
      {/* Headlights */}
      <rect x="2.6" y="1.8" width="2.4" height="1.2" rx="0.6" className="fill-amber-300" />
      <rect x="9" y="1.8" width="2.4" height="1.2" rx="0.6" className="fill-amber-300" />
      {/* Tail lights */}
      <rect x="2.6" y="23" width="2.4" height="1" rx="0.5" className="fill-red-500" />
      <rect x="9" y="23" width="2.4" height="1" rx="0.5" className="fill-red-500" />
    </svg>
  );
}
