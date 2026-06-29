import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useFarmData } from '../hooks/useFarmData';
import { formatCurrency } from '../lib/utils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';
import { FileText, Download, TrendingUp } from 'lucide-react';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const { transactions, paddocks, livestockMobs } = useFarmData();
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amountAUD, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountAUD, 0);
  const totalHa = paddocks.reduce((s, p) => s + p.hectares, 0);
  const totalHead = livestockMobs.reduce((s, m) => s + m.count, 0);

  // Income breakdown
  const incomeByCategory = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amountAUD;
      return acc;
    }, {} as Record<string, number>);

  const incomePieData = Object.entries(incomeByCategory).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  // Expense breakdown
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amountAUD;
      return acc;
    }, {} as Record<string, number>);

  const expenseBarData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const reports = [
    { id: 'financial', title: 'Financial Summary', description: 'P&L, GST, cash flow – FY 2024–25', icon: '💰' },
    { id: 'livestock', title: 'Livestock Report', description: 'Herd composition, NLIS movements, health events', icon: '🐑' },
    { id: 'crops', title: 'Crop & Agronomy Report', description: 'Crop records, yields, spray diary', icon: '🌾' },
    { id: 'paddock', title: 'Paddock History', description: 'Crop rotation, soil tests, grazing records', icon: '🗺️' },
    { id: 'equipment', title: 'Equipment & Maintenance', description: 'Asset register, service history, depreciation', icon: '🚜' },
    { id: 'rainfall', title: 'Rainfall & Weather', description: 'Monthly rainfall vs average, evaporation', icon: '🌧️' },
    { id: 'compliance', title: 'Compliance & Chem Diary', description: 'Chemical use register, withholding periods', icon: '📋' },
    { id: 'carbon', title: 'Carbon Footprint Estimate', description: 'Scope 1 & 2 emissions estimate for the farm', icon: '🌱' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Farm performance, compliance, and export-ready reports"
        actions={
          <button className="btn-secondary" onClick={() => toast('Export centre – coming in full release')}>
            <Download className="w-4 h-4" /> Export All
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="YTD Net" value={formatCurrency(income - expense)} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <StatCard title="Total Hectares" value={`${totalHa.toLocaleString()} ha`} icon={<FileText className="w-5 h-5" />} color="blue" />
        <StatCard title="Total Livestock" value={totalHead.toLocaleString()} icon={<FileText className="w-5 h-5" />} color="amber" />
        <StatCard title="Revenue / ha" value={formatCurrency(income / totalHa)} icon={<TrendingUp className="w-5 h-5" />} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-4">Income Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={incomePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {incomePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="section-title mb-4">Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={expenseBarData} layout="vertical" margin={{ left: 60, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report cards */}
      <div>
        <h2 className="section-title mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.map(r => (
            <div key={r.id} className="card hover:shadow-md transition-shadow cursor-pointer group" onClick={() => toast(`${r.title} – generating…`, { icon: r.icon })}>
              <div className="text-3xl mb-3">{r.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-farm-700 transition-colors text-sm">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{r.description}</p>
              <button className="mt-3 btn-secondary text-xs py-1.5 w-full" onClick={(e) => { e.stopPropagation(); toast(`Generating ${r.title}…`, { icon: '📄' }); }}>
                <Download className="w-3 h-3" /> Export PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
