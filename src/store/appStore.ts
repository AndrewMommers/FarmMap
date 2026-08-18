import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from '../types';

export interface NotificationPrefs {
  taskOverdue: boolean;
  lowStock: boolean;
  equipmentService: boolean;
  rainfallEvents: boolean;
  livestockHealth: boolean;
  budgetOverruns: boolean;
  /** Whether the user has opted in to browser/OS push notifications — actual
   *  delivery also depends on Notification.permission being granted. */
  browserPush: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  taskOverdue: true,
  lowStock: true,
  equipmentService: true,
  rainfallEvents: true,
  livestockHealth: true,
  budgetOverruns: true,
  browserPush: false,
};

interface AppStore extends AppState {
  demoMode: boolean;
  notificationPrefs: NotificationPrefs;
  setActiveFarm: (id: string) => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setDemoMode: (v: boolean) => void;
  setNotificationPrefs: (prefs: Partial<NotificationPrefs>) => void;
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
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      setActiveFarm: (id) => set({ activeFarmId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      setDemoMode: (v) => set({ demoMode: v }),
      setNotificationPrefs: (prefs) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...prefs } })),
    }),
    { name: 'farmmap-app' }
  )
);
