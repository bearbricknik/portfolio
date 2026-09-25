import { create } from "zustand";

/**
 * In-memory record of finished streams (StreamingText `id`s).
 * Lives only as long as the JS runtime: client navigations and language
 * switches keep it, a (hard) refresh starts empty again.
 */
type StreamingStore = {
  seen: Record<string, true>;
  markSeen: (id: string) => void;
};

export const useStreamingStore = create<StreamingStore>()((set) => ({
  seen: {},
  markSeen: (id) =>
    set((state) => (state.seen[id] ? state : { seen: { ...state.seen, [id]: true } })),
}));
