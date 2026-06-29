import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useFarmData } from '../hooks/useFarmData';
import { formatDate } from '../lib/utils';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';

export function WeatherPage() {
  const { farm, weatherReadings, rainfallSummary, weatherLoading } = useFarmData();
  const today = weatherReadings.length > 0 ? weatherReadings[weatherReadings.length - 1] : null;
  const ytdRainfall = rainfallSummary.reduce((s, r) => s + r.rainfallMm, 0);

  // Last 14 days for the table, last 14 days for the temp chart
  const recentReadings = weatherReadings.slice(-14).reverse();
  const tempData = weatherReadings.slice(-14).map(w => ({
    date: w.date.slice(5),
    max: w.tempMaxC,
    min: w.tempMinC,
  }));

  const subtitle = farm ? `${farm.region}, ${farm.state} · Live data via Open-Meteo` : 'Live data via Open-Meteo';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather Station"
        subtitle={subtitle}
      />

      {weatherLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-50 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Max" value={today ? `${today.tempMaxC}°C` : '—'} subtitle={today ? `Min: ${today.tempMinC}°C` : ''} icon={<Thermometer className="w-5 h-5" />} color="amber" />
          <StatCard title="Today's Rainfall" value={today ? `${today.rainfallMm} mm` : '—'} icon={<Droplets className="w-5 h-5" />} color="blue" />
          <StatCard title="3-Month Rainfall" value={`${ytdRainfall.toFixed(1)} mm`} subtitle={`${rainfallSummary.length} months`} icon={<Cloud className="w-5 h-5" />} color="green" />
          <StatCard title="Wind Speed" value={today ? `${today.windKph} km/h` : '—'} subtitle={today?.evapMm != null ? `Evap: ${today.evapMm} mm` : ''} icon={<Wind className="w-5 h-5" />} color="purple" />
        </div>
      )}

      {/* Recent daily table */}
      <div className="card">
        <h2 className="section-title mb-4">14-Day Weather Record</h2>
        {weatherLoading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(7)].map((_, i) => <div key={i} className="h-8 bg-gray-50 dark:bg-gray-800 rounded" />)}
          </div>
        ) : recentReadings.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No weather data available for this location.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr>
                  {['Date', 'Max °C', 'Min °C', 'Rainfall (mm)', 'Wind (km/h)', 'Evap (mm)'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentReadings.map(w => (
                  <tr key={w.date} className="hover:bg-farm-50/50 transition-colors">
                    <td className="table-cell font-medium">{formatDate(w.date)}</td>
                    <td className="table-cell text-red-600 font-semibold">{w.tempMaxC}°</td>
                    <td className="table-cell text-blue-600 font-semibold">{w.tempMinC}°</td>
                    <td className={`table-cell font-bold ${w.rainfallMm > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{w.rainfallMm}</td>
                    <td className="table-cell">{w.windKph ?? '—'}</td>
                    <td className="table-cell">{w.evapMm ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-4">Temperature – Last 14 Days</h2>
          {weatherLoading || tempData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-300 animate-pulse">
              <Cloud className="w-12 h-12" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tempData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="°" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="max" name="Max °C" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="min" name="Min °C" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Monthly Rainfall</h2>
          {weatherLoading || rainfallSummary.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-300 animate-pulse">
              <Droplets className="w-12 h-12" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rainfallSummary} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="mm" />
                <Tooltip />
                <Area type="monotone" dataKey="rainfallMm" name="Rainfall (mm)" stroke="#0ea5e9" fill="url(#r1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">📡 Live Weather Data</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Weather data is sourced live from <strong>Open-Meteo</strong> (open-meteo.com) using your farm's address.
          Data updates every 30 minutes. For fire danger ratings and official BOM alerts, visit bom.gov.au.
        </p>
      </div>
    </div>
  );
}
