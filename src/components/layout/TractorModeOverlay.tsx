import { Link } from 'react-router-dom';
import { useTractorStore } from '../../store/tractorStore';
import { useFarmData } from '../../hooks/useFarmData';
import { formatDate } from '../../lib/utils';
import { X, AlertTriangle, Cloud, CheckCircle2 } from 'lucide-react';

const quickLinks = [
  { to: '/tasks',     label: 'Tasks',      emoji: '✅', bg: 'bg-blue-600'   },
  { to: '/livestock', label: 'Livestock',  emoji: '🐑', bg: 'bg-amber-600'  },
  { to: '/paddocks',  label: 'Paddocks',   emoji: '🗺️', bg: 'bg-farm-700'  },
  { to: '/weather',   label: 'Weather',    emoji: '🌤️', bg: 'bg-sky-600'   },
  { to: '/inventory', label: 'Inventory',  emoji: '📦', bg: 'bg-purple-600' },
  { to: '/finance',   label: 'Finance',    emoji: '💰', bg: 'bg-emerald-700'},
];

export function TractorModeOverlay() {
  const { tractorMode, set } = useTractorStore();
  const { farm, tasks, weatherReadings, livestockMobs, paddocks } = useFarmData();
  if (!tractorMode) return null;

  const today = weatherReadings.length > 0 ? weatherReadings[weatherReadings.length - 1] : null;
  const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()));
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').slice(0, 4);
  const totalHead = livestockMobs.reduce((s, m) => s + m.count, 0);
  const activePaddocks = paddocks.filter(p => p.status === 'active').length;

  return (
    <div className="fixed inset-0 z-40 bg-farm-950 text-white flex flex-col overflow-hidden">
      {/* Tractor Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-farm-900 border-b border-farm-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-farm-500 rounded-xl flex items-center justify-center text-xl">🚜</div>
          <div>
            <p className="text-xl font-extrabold leading-none">Tractor Mode</p>
            <p className="text-farm-300 text-sm">{farm?.name ?? 'My Farm'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
    </div>
  );
}
