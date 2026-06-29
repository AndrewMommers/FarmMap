import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  dark: boolean;
  toggle: () => void;
}

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => {
        const next = !get().dark;
        applyTheme(next);
        set({ dark: next });
      },
    }),
    {
      name: 'farmmap-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.dark);
      },
    }
  )
);
