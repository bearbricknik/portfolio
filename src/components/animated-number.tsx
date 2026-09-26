"use client";

import NumberFlow, { type NumberFlowProps } from "@number-flow/react";
import { useLocale } from "next-intl";

/**
 * Number that rolls its digits when the value changes (NumberFlow), formatted
 * for the active locale ("77.288" / "77,288"). Respects prefers-reduced-motion.
 * Use it for any number that updates on the page.
 */
export function AnimatedNumber({ locales, ...props }: NumberFlowProps) {
  const locale = useLocale();
  return <NumberFlow locales={locales ?? locale} {...props} />;
}

export { NumberFlowGroup as AnimatedNumberGroup } from "@number-flow/react";
