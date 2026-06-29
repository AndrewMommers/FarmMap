import { useRef, useState, useEffect } from 'react';
import {
  Menu, Bell, Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudFog,
  Snowflake, Tractor, Moon, LogOut, FlaskConical, Wind,
  AlertCircle, AlertTriangle, Info, Package, Wrench, CheckSquare,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTractorStore } from '../../store/tractorStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { useFarmData } from '../../hooks/useFarmData';
import { useWeather, wmoLabel, wmoCategory } from '../../hooks/useWeather';
import { useNotifications } from '../../hooks/useNotifications';
import { clearWeatherCache } from '../../hooks/useWeatherHistory';
import type { FarmNotification, NotifPriority, NotifType } from '../../hooks/useNotifications';
import { FarmSwitcher } from './FarmSwitcher';

// ─── Weather icon ─────────────────────────────────────────────────────────────

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const cat = wmoCategory(code);
  const props = { className: className ?? 'w-4 h-4' };
  if (cat === 'clear')   return <Sun {...props} />;
  if (cat === 'fog')     return <CloudFog {...props} />;
  if (cat === 'drizzle') return <CloudDrizzle {...props} />;
  if (cat === 'rain')    return <CloudRain {...props} />;
  if (cat === 'snow')    return <Snowflake {...props} />;
  if (cat === 'storm')   return <CloudLightning {...props} />;
  return <Cloud {...props} />;
}

// ─── Notification helpers ─────────────────────────────────────────────────────

const PRIORITY_ICON: Record<NotifPriority, typeof AlertCircle> = {
  critical: AlertCircle,
  high:     AlertTriangle,
  medium:   Info,
  info:     Info,
};
const PRIORITY_COLOR: Record<NotifPriority, string> = {
  critical: 'text-red-500',
  high:     'text-orange-500',
  medium:   'text-yellow-500',
  info:     'text-blue-400',
};
const TYPE_ICON: Record<NotifType, typeof AlertCircle> = {
  task:      CheckSquare,
  inventory: Package,
  equipment: Wrench,
};

function NotificationDropdown({
  alerts,
  onClose,
}: {
  alerts: FarmNotification[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Notifications</h3>
        {alerts.length > 0 && (
          <span className="text-xs text-gray-400">{alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-400">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 text-farm-300" />
          <p className="text-sm font-medium">All clear — nothing needs attention</p>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {alerts.map((a) => {
            const PIcon = PRIORITY_ICON[a.priority];
            const TIcon = TYPE_ICON[a.type];
            return (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <PIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${PRIORITY_COLOR[a.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{a.message}</p>
                  {a.detail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{a.detail}</p>
                  )}
                </div>
                <TIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { toggleSidebar, demoMode, setDemoMode } = useAppStore();
  const { toggle: toggleTractor, tractorMode } = useTractorStore();
  const { dark, toggle: toggleDark } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const clearData = useDataStore((s) => s.clearData);

  const { farm, paddocks } = useFarmData();
  const firstCoords = paddocks.find((p) => p.coordinates)?.coordinates;
  const { weather, loading: weatherLoading } = useWeather(farm?.address, firstCoords);
  const { alerts, count: notifCount } = useNotifications();

  const [showNotifs, setShowNotifs] = useState(false);

  const handleSignOut = () => {
    clearWeatherCache(); // purge cached weather so next farm/user fetches fresh data
    if (demoMode) {
      setDemoMode(false);
      clearData();
    } else {
      signOut();
    }
  };

  const initials = demoMode
    ? 'DM'
    : ((user?.user_metadata?.name as string | undefined)
        ?.split(' ')
        .map((p: string) => p[0])
        .slice(0, 2)
        .join('') ?? user?.email?.[0]?.toUpperCase() ?? '?');

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-farm-100 dark:border-gray-800 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-10">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <FarmSwitcher />

      {demoMode && (
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-700">
          <FlaskConical className="w-3.5 h-3.5" />
          Demo
        </span>
      )}

      <div className="flex-1" />

      {/* Live weather widget — key on farm ID so it resets when farm changes */}
      <div key={farm?.id ?? 'no-farm'} className="hidden md:flex items-center gap-2 bg-farm-50 dark:bg-gray-800 rounded-xl px-3 py-1.5 text-sm">
        {weatherLoading || !weather ? (
          <>
            <Cloud className="w-4 h-4 text-farm-400 animate-pulse" />
            <span className="text-gray-400 text-xs">{weatherLoading ? '…' : '—'}</span>
          </>
        ) : (
          <>
            <WeatherIcon code={weather.code} className="w-4 h-4 text-farm-500" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">
              {weather.tempMax}°
              <span className="text-gray-400 font-normal ml-0.5 text-xs">/{weather.tempMin}°</span>
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {weather.rainfall > 0 ? `${weather.rainfall}mm` : wmoLabel(weather.code)}
            </span>
            {weather.windKph > 20 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <Wind className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">{weather.windKph}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Dark mode */}
      <button
        onClick={toggleDark}
        className="p-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Tractor mode */}
      <button
        onClick={toggleTractor}
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
          tractorMode
            ? 'bg-farm-700 text-white'
            : 'bg-farm-50 hover:bg-farm-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-farm-700 dark:text-farm-300'
        }`}
        aria-label="Toggle tractor mode"
      >
        <Tractor className="w-4 h-4" />
        <span className="hidden lg:inline">Tractor</span>
      </button>

      {/* Notifications bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs((v) => !v)}
          className="relative p-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount})` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
        {showNotifs && (
          <NotificationDropdown alerts={alerts} onClose={() => setShowNotifs(false)} />
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
        aria-label={demoMode ? 'Exit demo' : 'Sign out'}
        title={demoMode ? 'Exit demo' : 'Sign out'}
      >
        <LogOut className="w-5 h-5" />
      </button>

      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer select-none ${demoMode ? 'bg-amber-500' : 'bg-farm-700'}`}
        title={demoMode ? 'Demo Mode' : user?.email}
      >
        {initials}
      </div>
    </header>
  );
}

