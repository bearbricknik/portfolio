import { create } from "zustand";

/**
 * In-memory stream state. Lives only as long as the JS runtime: client
 * navigations and language switches keep it, a (hard) refresh starts empty.
 *
 * - `seen`: finished streams (StreamingText `id`s) → render instantly next time
 * - `active`: streams currently animating on the page → ScrollReveal /
 *   HandwrittenNote with `waitForStreams` stay hidden until this is empty
 */
type StreamingStore = {
  seen: Record<string, true>;
  active: Record<string, true>;
  markSeen: (id: string) => void;
  setActive: (key: string, active: boolean) => void;
};

export const useStreamingStore = create<StreamingStore>()((set) => ({
  seen: {},
  active: {},
  markSeen: (id) =>
    set((state) => (state.seen[id] ? state : { seen: { ...state.seen, [id]: true } })),
  setActive: (key, active) =>
    set((state) => {
      if (active === Boolean(state.active[key])) return state;
      const next = { ...state.active };
      if (active) next[key] = true;
      else delete next[key];
      return { active: next };
    }),
}));

/** True while no StreamingText on the page is animating */
export const useStreamsIdle = () =>
  useStreamingStore((state) => Object.keys(state.active).length === 0);
