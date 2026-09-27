"use client";

import { useRef } from "react";
import { IconBirthdayCake } from "@central-icons-react/round-outlined-radius-3-stroke-1.5";
import confetti from "canvas-confetti";

import { Badge } from "@/components/inline-badge";

// Hovering again within this time doesn't fire another burst
const COOLDOWN_MS = 1200;

/** "Birthday" badge that bursts a little confetti from itself on hover/focus */
export function BirthdayBadge({ label }: { label: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const lastBurst = useRef(0);

  const burst = () => {
    const now = Date.now();
    if (now - lastBurst.current < COOLDOWN_MS || !ref.current) return;
    lastBurst.current = now;

    const rect = ref.current.getBoundingClientRect();
    confetti({
      particleCount: 40,
      spread: 70,
      startVelocity: 22,
      scalar: 0.7,
      ticks: 140,
      // Burst from the middle of the badge (origin is relative to the viewport)
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      disableForReducedMotion: true,
      zIndex: 60,
    });
  };

  return (
    <span ref={ref} tabIndex={0} onPointerEnter={burst} onFocus={burst} className="rounded-md outline-none">
      <Badge icon={IconBirthdayCake} color="text-pink-500">
        {label}
      </Badge>
    </span>
  );
}
