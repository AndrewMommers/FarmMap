import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../lib/utils';
import { useFarmData } from '../hooks/useFarmData';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { paddocks, livestockMobs, tasks, transactions, weatherReadings, rainfallSummary, weatherLoading } = useFarmData();
  const totalLivestock = livestockMobs.reduce((sum, m) => sum + m.count, 0);
  const activePaddocks = paddocks.filter((p) => p.status === 'active').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
  const overdueTasks = tasks.filter((t) => t.status === 'overdue' || (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date())).length;
  const totalHectares = paddocks.reduce((s, p) => s + p.hectares, 0);
  const ytdIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountAUD, 0);
  const ytdExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountAUD, 0);
  const recentTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5);
  const recentTx = transactions.slice(0, 5);
  const todayWeather = weatherReadings.length > 0 ? weatherReadings[weatherReadings.length - 1] : null;

  // Monthly P&L computed from live transactions (last 6 months)
  const monthlyPnl = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const ym = t.date.slice(0, 7);
      if (!map[ym]) map[ym] = { income: 0, expense: 0 };
      if (t.type === 'income') map[ym].income += t.amountAUD;
      else map[ym].expense += t.amountAUD;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([ym, v]) => ({
        month: new Date(ym + '-15').toLocaleString('en-AU', { month: 'short', year: '2-digit' }),
        ...v,
      }));
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            You have <strong>{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</strong> that require immediate attention.
          </p>
          <Link to="/tasks" className="ml-auto text-sm text-red-700 underline font-semibold whitespace-nowrap">View tasks</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hectares"
          value={`${totalHectares.toLocaleString()} ha`}
          subtitle={`${activePaddocks} active paddocks`}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
          color="green"
        />
        <StatCard
          title="Total Livestock"
          value={totalLivestock.toLocaleString()}
          subtitle={`${livestockMobs.length} mobs / groups`}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          color="amber"
        />
        <StatCard
          title="YTD Revenue"
          value={formatCurrency(ytdIncome)}
          subtitle={`${formatCurrency(ytdIncome - ytdExpense)} net`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          trend={{ value: 12, label: 'vs last year' }}
        />
        <StatCard
          title="Open Tasks"
          value={pendingTasks}
          subtitle={overdueTasks > 0 ? `${overdueTasks} overdue` : 'All on track'}
          icon={<Clock className="w-5 h-5" />}
          color={overdueTasks > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P&L Chart */}
        <div className="card">
          <h2 className="section-title mb-4">Income vs Expenses (Monthly)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPnl} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rainfall chart */}
        <div className="card">
          <h2 className="section-title mb-4">Rainfall – Last 3 Months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={rainfallSummary} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="rainfallMm" name="Actual (mm)" stroke="#0ea5e9" fill="url(#rain)" strokeWidth={2} />
              <Area type="monotone" dataKey="avgRainfallMm" name="Average (mm)" stroke="#94a3b8" fill="none" strokeDasharray="4 2" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's weather */}
        <div className="card">
          <h2 className="section-title mb-4">Today's Conditions</h2>
          {weatherLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : todayWeather ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Max / Min</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{todayWeather.tempMaxC}°C / {todayWeather.tempMinC}°C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Rainfall</span>
                <span className="text-sm font-semibold text-blue-700">{todayWeather.rainfallMm} mm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Wind</span>
                <span className="text-sm font-semibold">{todayWeather.windKph ?? '—'} km/h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Evaporation</span>
                <span className="text-sm font-semibold">{todayWeather.evapMm != null ? `${todayWeather.evapMm} mm` : '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No weather data available</p>
          )}
          <Link to="/weather" className="mt-4 block text-xs text-farm-600 hover:underline font-medium">Full weather report →</Link>
        </div>

        {/* Upcoming Tasks */}
        <div className="card lg:col-span-1">
          <h2 className="section-title mb-4">Priority Tasks</h2>
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 text-sm">
                {task.status === 'done'
                  ? <CheckCircle2 className="w-4 h-4 text-farm-500 mt-0.5 flex-shrink-0" />
                  : task.status === 'overdue'
                  ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  : <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                  {task.dueDate && <p className="text-xs text-gray-400">{formatDate(task.dueDate)}</p>}
                </div>
                <StatusBadge status={task.priority} />
              </div>
            ))}
          </div>
          <Link to="/tasks" className="mt-4 block text-xs text-farm-600 hover:underline font-medium">View all tasks →</Link>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="section-title mb-4">Recent Transactions</h2>
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.type === 'income' ? 'bg-farm-500' : 'bg-red-400'}`} />
                <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{tx.description}</span>
                <span className={`font-semibold ${tx.type === 'income' ? 'text-farm-700' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amountAUD)}
                </span>
              </div>
            ))}
          </div>
          <Link to="/finance" className="mt-4 block text-xs text-farm-600 hover:underline font-medium">View all transactions →</Link>
        </div>
      </div>

      {/* Paddocks summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Paddock Overview</h2>
          <Link to="/paddocks" className="text-xs text-farm-600 hover:underline font-medium">Manage paddocks →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr>
                {['Paddock', 'Hectares', 'Status', 'Current Use', 'Last Activity'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paddocks.map((p) => (
                <tr key={p.id} className="hover:bg-farm-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                  <td className="table-cell">{p.hectares} ha</td>
                  <td className="table-cell"><StatusBadge status={p.status} /></td>
                  <td className="table-cell text-gray-600 dark:text-gray-400">{p.currentCrop ?? '—'}</td>
                  <td className="table-cell text-gray-400">{formatDate(p.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
