import { Menu, Bell, Sun, Cloud, Tractor, Moon, LogOut } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTractorStore } from '../../store/tractorStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { FarmSwitcher } from './FarmSwitcher';
import { weatherReadings } from '../../data/mockData';

export function Header() {
  const { toggleSidebar } = useAppStore();
  const { toggle: toggleTractor, tractorMode } = useTractorStore();
  const { dark, toggle: toggleDark } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const today = weatherReadings[weatherReadings.length - 1];

  const initials = (user?.user_metadata?.name as string | undefined)
    ?.split(' ')
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('') ?? user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-farm-100 dark:border-gray-800 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-10">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Farm Switcher */}
      <FarmSwitcher />

      <div className="flex-1" />

      {/* Weather widget */}
      <div className="hidden md:flex items-center gap-2 bg-farm-50 dark:bg-gray-800 rounded-xl px-3 py-1.5 text-sm">
        <Cloud className="w-4 h-4 text-farm-500" />
        <span className="text-gray-700 dark:text-gray-200 font-medium">{today.tempMaxC}°C</span>
        <span className="text-gray-400">|</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{today.rainfallMm > 0 ? `${today.rainfallMm}mm` : 'No rain'}</span>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="p-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Tractor Mode button */}
      <button
        onClick={toggleTractor}
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
          tractorMode ? 'bg-farm-700 text-white' : 'bg-farm-50 hover:bg-farm-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-farm-700 dark:text-farm-300'
        }`}
        aria-label="Toggle tractor mode"
      >
        <Tractor className="w-4 h-4" />
        <span className="hidden lg:inline">Tractor</span>
      </button>

      <button className="relative p-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Notifications">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <button
        onClick={() => signOut()}
        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="w-5 h-5" />
      </button>

      <div className="w-8 h-8 rounded-full bg-farm-700 flex items-center justify-center text-white text-xs font-bold cursor-pointer select-none" title={user?.email}>
        {initials}
      </div>
    </header>
  );
}
