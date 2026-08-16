import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTractorStore } from '../../store/tractorStore';
import { useFarmData } from '../../hooks/useFarmData';
import { useDataStore } from '../../store/dataStore';
import { useAppStore } from '../../store/appStore';
import { useDevices } from '../../hooks/useDevices';
import { useDeviceLocationTracking, type GpsStatus } from '../../hooks/useDeviceLocationTracking';
import { FarmMapLeaflet } from '../map/FarmMapLeaflet';
import { formatDate, getInitials } from '../../lib/utils';
import {
  X, AlertTriangle, Cloud, CheckCircle2, Map as MapIcon,
  LayoutGrid, Users as UsersIcon, Phone, MapPin, MapPinOff,
} from 'lucide-react';

const GPS_STATUS_META: Record<GpsStatus, { label: string; className: string }> = {
  idle:        { label: 'GPS off',         className: 'bg-farm-800 text-farm-400' },
  locating:    { label: 'Locating…',       className: 'bg-amber-900/50 text-amber-300' },
  active:      { label: 'GPS active',      className: 'bg-sky-900/50 text-sky-300' },
  denied:      { label: 'Location blocked',className: 'bg-red-900/50 text-red-300' },
  unsupported: { label: 'GPS unsupported', className: 'bg-farm-800 text-farm-500' },
  error:       { label: 'GPS error',       className: 'bg-red-900/50 text-red-300' },
};

const quickLinks = [
  { to: '/tasks',     label: 'Tasks',      emoji: '✅', bg: 'bg-blue-600'   },
  { to: '/livestock', label: 'Livestock',  emoji: '🐑', bg: 'bg-amber-600'  },
  { to: '/paddocks',  label: 'Paddocks',   emoji: '🗺️', bg: 'bg-farm-700'  },
  { to: '/weather',   label: 'Weather',    emoji: '🌤️', bg: 'bg-sky-600'   },
  { to: '/inventory', label: 'Inventory',  emoji: '📦', bg: 'bg-purple-600' },
  { to: '/finance',   label: 'Finance',    emoji: '💰', bg: 'bg-emerald-700'},
];

const TM_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'map',      label: 'Map',      icon: MapIcon },
  { id: 'team',     label: 'Team',     icon: UsersIcon },
] as const;

export function TractorModeOverlay() {
  const { tractorMode, set } = useTractorStore();
  const { farm, tasks, weatherReadings, livestockMobs, paddocks, users } = useFarmData();
  const { activeFarmId } = useAppStore();
  const allFenceLines = useDataStore((s) => s.fenceLines);
  const allMapFeatures = useDataStore((s) => s.mapFeatures);
  const { thisDevice } = useDevices();
  const { status: gpsStatus, location: gpsLocation, accuracy: gpsAccuracy, currentPaddock } = useDeviceLocationTracking();
  const [tmTab, setTmTab] = useState<'overview' | 'map' | 'team'>('overview');

  if (!tractorMode) return null;

  const fenceLines = allFenceLines.filter((f) => f.farmId === activeFarmId);
  const mapFeatures = allMapFeatures.filter((f) => f.farmId === activeFarmId);

  const today = weatherReadings.length > 0 ? weatherReadings[weatherReadings.length - 1] : null;
  const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()));
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').slice(0, 4);
  const totalHead = livestockMobs.reduce((s, m) => s + m.count, 0);
  const activePaddocks = paddocks.filter(p => p.status === 'active').length;
  const teamMembers = users.filter(u => u.active);

  return (
    <div className="fixed inset-0 z-40 bg-farm-950 text-white flex flex-col overflow-hidden">
      {/* Tractor Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-6 py-4 bg-farm-900 border-b border-farm-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-farm-500 rounded-xl flex items-center justify-center text-xl">🚜</div>
          <div>
            <p className="text-xl font-extrabold leading-none">Tractor Mode</p>
            <p className="text-farm-300 text-sm">{farm?.name ?? 'My Farm'}{thisDevice ? ` · ${thisDevice.name}` : ''}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-farm-800 rounded-2xl p-1">
          {TM_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTmTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                tmTab === id ? 'bg-farm-500 text-farm-950' : 'text-farm-200 hover:bg-farm-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* GPS status */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold ${GPS_STATUS_META[gpsStatus].className}`}>
            {gpsStatus === 'denied' || gpsStatus === 'unsupported' || gpsStatus === 'error'
              ? <MapPinOff className="w-4 h-4" />
              : <MapPin className={`w-4 h-4 ${gpsStatus === 'locating' ? 'animate-pulse' : ''}`} />}
            {GPS_STATUS_META[gpsStatus].label}
          </div>
          {/* Date & Time */}
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-bold leading-none">{new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-farm-300 text-sm">{new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>
          {/* Weather */}
          {today && (
          <div className="bg-farm-800 rounded-2xl px-4 py-2 flex items-center gap-2 hidden sm:flex">
            <Cloud className="w-5 h-5 text-sky-300" />
            <span className="text-lg font-bold">{today.tempMaxC}°C</span>
            <span className="text-farm-300 text-sm">{today.rainfallMm > 0 ? `${today.rainfallMm}mm` : 'No rain'}</span>
          </div>
          )}
          <button
            onClick={() => set(false)}
            className="bg-red-600 hover:bg-red-700 rounded-2xl p-3 transition-colors"
            aria-label="Exit tractor mode"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {tmTab === 'overview' && (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Alerts */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-900/60 border border-red-600 rounded-3xl px-6 py-4 flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xl font-bold text-red-300">{overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}</p>
              {overdueTasks.map(t => (
                <p key={t.id} className="text-base text-red-200 mt-1">{t.title}</p>
              ))}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Livestock', value: totalHead.toLocaleString(), sub: 'head' },
            { label: 'Active Paddocks', value: activePaddocks, sub: 'of ' + paddocks.length },
            { label: 'Today Max', value: today ? `${today.tempMaxC}°C` : '—', sub: today ? `Min ${today.tempMinC}°C` : '' },
            { label: 'Today Rain', value: today ? `${today.rainfallMm}mm` : '—', sub: today ? `Wind ${today.windKph} km/h` : '' },
          ].map(s => (
            <div key={s.label} className="bg-farm-800 rounded-3xl px-5 py-4">
              <p className="text-farm-300 text-sm font-medium">{s.label}</p>
              <p className="text-4xl font-extrabold text-white mt-1">{s.value}</p>
              <p className="text-farm-400 text-sm mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Nav Buttons */}
        <div>
          <p className="text-farm-300 text-sm font-semibold uppercase tracking-wide mb-3">Quick Navigation</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => set(false)}
                className={`${link.bg} hover:opacity-90 rounded-3xl px-6 py-5 flex flex-col items-center gap-2 transition-opacity text-center`}
              >
                <span className="text-4xl">{link.emoji}</span>
                <span className="text-lg font-bold">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's tasks */}
        <div>
          <p className="text-farm-300 text-sm font-semibold uppercase tracking-wide mb-3">Today's Priority Tasks</p>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="bg-farm-800 rounded-3xl px-5 py-5 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-farm-400" />
                <p className="text-xl font-semibold text-farm-200">All tasks complete – great work!</p>
              </div>
            ) : (
              pendingTasks.map(t => (
                <div key={t.id} className="bg-farm-800 rounded-3xl px-5 py-4 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    t.priority === 'critical' ? 'bg-red-400' :
                    t.priority === 'high' ? 'bg-orange-400' :
                    t.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white truncate">{t.title}</p>
                    <p className="text-farm-300 text-sm">{t.dueDate ? `Due ${formatDate(t.dueDate)}` : 'No due date'}{t.assignedTo ? ` · ${t.assignedTo}` : ''}</p>
                  </div>
                  <span className="text-farm-300 capitalize text-sm font-medium">{t.priority}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {tmTab === 'map' && (
        <div className="flex-1 min-h-0 p-3 relative">
          <FarmMapLeaflet
            paddocks={paddocks}
            fenceLines={fenceLines}
            mapFeatures={mapFeatures}
            address={farm?.address}
            liveMarker={gpsLocation ? { position: gpsLocation, label: thisDevice?.name, accuracyM: gpsAccuracy } : undefined}
          />
          {gpsLocation && (
            <div className="absolute top-6 left-6 z-[1000] bg-farm-950/90 backdrop-blur rounded-2xl px-4 py-2.5 shadow-lg border border-farm-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span className="text-sm font-bold text-white">
                {currentPaddock ? `Currently in ${currentPaddock.name}` : 'Outside any mapped paddock'}
              </span>
            </div>
          )}
          {gpsStatus === 'denied' && (
            <div className="absolute top-6 left-6 z-[1000] bg-red-950/90 backdrop-blur rounded-2xl px-4 py-2.5 shadow-lg border border-red-700 flex items-center gap-2 max-w-sm">
              <MapPinOff className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm font-medium text-red-200">
                Location access is blocked — enable it for this site in your browser settings to see your position here.
              </span>
            </div>
          )}
        </div>
      )}

      {tmTab === 'team' && (
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-farm-300 text-sm font-semibold uppercase tracking-wide mb-3">
            {farm?.name ?? 'Farm'} Team
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamMembers.map((u) => (
              <div key={u.id} className="bg-farm-800 rounded-3xl px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-farm-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {u.avatar || getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-white truncate">{u.name}</p>
                  <p className="text-farm-300 text-sm capitalize">{u.role}</p>
                </div>
                {u.phone && (
                  <a
                    href={`tel:${u.phone.replace(/\s/g, '')}`}
                    className="bg-farm-700 hover:bg-farm-600 rounded-2xl p-3 transition-colors flex-shrink-0"
                    aria-label={`Call ${u.name}`}
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                )}
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div className="bg-farm-800 rounded-3xl px-5 py-5 flex items-center gap-4 sm:col-span-2">
                <UsersIcon className="w-8 h-8 text-farm-400 flex-shrink-0" />
                <p className="text-lg font-semibold text-farm-200">No team members yet — add them from Settings → Users & Access.</p>
              </div>
            )}
          </div>
          <p className="text-farm-500 text-xs mt-4">Showing {farm?.name ?? 'this farm'}'s team only.</p>
        </div>
      )}
    </div>
  );
}
