"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { HiTrip } from "@/lib/hi";

type HiState = {
  /** Name from the address, or null on the generic page */
  name: string | null;
  /** Plus points the visitor has seen so far */
  points: number;
  /** Counts a plus point once (by its id), when it has actually appeared */
  collect: (id: string) => void;
  trip: HiTrip | null;
  setTrip: (trip: HiTrip) => void;
};

const HiStateContext = createContext<HiState | null>(null);

export function useHiState() {
  const context = useContext(HiStateContext);
  if (!context) throw new Error("useHiState must be used inside <HiStateProvider>");
  return context;
}

/** Shared state of the /hi page: collected plus points and the chosen trip */
export function HiStateProvider({ name, children }: { name: string | null; children: React.ReactNode }) {
  const [collected, setCollected] = useState<ReadonlySet<string>>(() => new Set());
  const [trip, setTrip] = useState<HiTrip | null>(null);

  const collect = useCallback((id: string) => {
    setCollected((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  const value = useMemo(
    () => ({ name, points: collected.size, collect, trip, setTrip }),
    [name, collected, collect, trip],
  );

  return <HiStateContext value={value}>{children}</HiStateContext>;
}
