import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TractorStore {
  tractorMode: boolean;
  toggle: () => void;
  set: (v: boolean) => void;
}

export const useTractorStore = create<TractorStore>()(
  persist(
    (set) => ({
      tractorMode: false,
      toggle: () => set((s) => ({ tractorMode: !s.tractorMode })),
      set: (v) => set({ tractorMode: v }),
    }),
    { name: 'farmmap-tractor' }
  )
);
