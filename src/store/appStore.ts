import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from '../types';

interface AppStore extends AppState {
  demoMode: boolean;
  setActiveFarm: (id: string) => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setDemoMode: (v: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeFarmId: 'farm-1',
      // Starts open on desktop (matches the lg breakpoint used throughout the
      // layout) and closed on phones/tablets, where an open sidebar is a
      // full-width drawer with a backdrop — not something a first-time mobile
      // visitor should land on. Persisted after that, per device.
      sidebarOpen: typeof window === 'undefined' || window.innerWidth >= 1024,
      demoMode: false,
      setActiveFarm: (id) => set({ activeFarmId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      setDemoMode: (v) => set({ demoMode: v }),
    }),
    { name: 'farmmap-app' }
  )
);
