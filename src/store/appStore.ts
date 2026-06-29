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
      sidebarOpen: true,
      demoMode: false,
      setActiveFarm: (id) => set({ activeFarmId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      setDemoMode: (v) => set({ demoMode: v }),
    }),
    { name: 'farmmap-app' }
  )
);
