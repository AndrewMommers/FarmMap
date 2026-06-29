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
  const { weatherReadings, rainfallSummary } = useFarmData();
  const today = weatherReadings[weatherReadings.length - 1];
  const ytdRainfall = rainfallSummary.reduce((s, r) => s + r.rainfallMm, 0);
  const avgRainfall = rainfallSummary.reduce((s, r) => s + r.avgRainfallMm, 0);

  const tempData = weatherReadings.map(w => ({
    date: w.date.slice(5),
    max: w.tempMaxC,
    min: w.tempMinC,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather Station"
        subtitle="Hillston, NSW · Station data + BOM integration"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Max" value={`${today.tempMaxC}°C`} subtitle={`Min: ${today.tempMinC}°C`} icon={<Thermometer className="w-5 h-5" />} color="amber" />
        <StatCard title="Today's Rainfall" value={`${today.rainfallMm} mm`} icon={<Droplets className="w-5 h-5" />} color="blue" />
        <StatCard title="YTD Rainfall" value={`${ytdRainfall} mm`} subtitle={`Avg: ${avgRainfall} mm`} icon={<Cloud className="w-5 h-5" />} color="green" />
        <StatCard title="Wind Speed" value={`${today.windKph} km/h`} subtitle={`Humidity: ${today.humidityPct}%`} icon={<Wind className="w-5 h-5" />} color="purple" />
      </div>

      {/* 7-day table */}
      <div className="card">
        <h2 className="section-title mb-4">7-Day Station Record</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr>
                {['Date', 'Max °C', 'Min °C', 'Rainfall (mm)', 'Humidity %', 'Wind (km/h)', 'Evap (mm)'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...weatherReadings].reverse().map(w => (
                <tr key={w.date} className="hover:bg-farm-50/50 transition-colors">
                  <td className="table-cell font-medium">{formatDate(w.date)}</td>
                  <td className="table-cell text-red-600 font-semibold">{w.tempMaxC}°</td>
                  <td className="table-cell text-blue-600 font-semibold">{w.tempMinC}°</td>
                  <td className={`table-cell font-bold ${w.rainfallMm > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{w.rainfallMm}</td>
                  <td className="table-cell">{w.humidityPct ?? '—'}%</td>
                  <td className="table-cell">{w.windKph ?? '—'}</td>
                  <td className="table-cell">{w.evapMm ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-4">Temperature – Last 7 Days</h2>
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
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Monthly Rainfall vs Average</h2>
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
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="rainfallMm" name="Actual (mm)" stroke="#0ea5e9" fill="url(#r1)" strokeWidth={2} />
              <Area type="monotone" dataKey="avgRainfallMm" name="Average (mm)" stroke="#94a3b8" fill="none" strokeDasharray="4 2" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800 font-medium">📡 BOM Integration</p>
        <p className="text-xs text-blue-600 mt-1">Connect your Bureau of Meteorology API key in Settings to pull live 7-day forecasts, fire danger ratings, and evapotranspiration data directly into FarmMap.</p>
      </div>
    </div>
  );
}
