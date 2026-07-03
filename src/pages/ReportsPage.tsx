import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { ExportMenu } from '../components/ui/ExportMenu';
import { useFarmData } from '../hooks/useFarmData';
import { formatCurrency, formatDate } from '../lib/utils';
import { downloadCSV, downloadPDF } from '../lib/export';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FileText, TrendingUp } from 'lucide-react';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const { transactions, paddocks, livestockMobs, livestock, equipment, tasks, inventory } = useFarmData();
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amountAUD, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountAUD, 0);
  const totalHa = paddocks.reduce((s, p) => s + p.hectares, 0);
  const totalHead = livestockMobs.reduce((s, m) => s + m.count, 0);

  // ── Export helpers ──────────────────────────────────────────────────────────
  const exportFinanceCSV  = () => downloadCSV('farmmap-finance', ['Date','Description','Category','Type','Amount'], transactions.map(t => [t.date, t.description, t.category, t.type, t.amountAUD]));
  const exportFinancePDF  = () => downloadPDF('farmmap-finance', 'Financial Summary', ['Date','Description','Category','Type','Amount (AUD)'], transactions.map(t => [t.date, t.description, t.category.replace(/_/g,' '), t.type, t.amountAUD]), `${transactions.length} transactions · Net ${formatCurrency(income - expense)}`);
  const exportLivestockCSV = () => downloadCSV('farmmap-livestock', ['Tag','Species','Breed','Gender','Status','DOB','Weight (kg)'], livestock.map(l => [l.tag, l.species, l.breed, l.gender, l.status, l.dob ?? '', l.weightKg ?? '']));
  const exportLivestockPDF = () => downloadPDF('farmmap-livestock', 'Livestock Report', ['Tag','Species','Breed','Gender','Status','DOB','Weight (kg)'], livestock.map(l => [l.tag, l.species, l.breed, l.gender, l.status, l.dob ?? '', l.weightKg ?? '']), `${livestock.length} animals · ${totalHead} total head`);
  const exportPaddockCSV  = () => downloadCSV('farmmap-paddocks', ['Name','Ha','Soil','Status','Current Crop','Last Activity'], paddocks.map(p => [p.name, p.hectares, p.soilType, p.status, p.currentCrop ?? '', formatDate(p.lastActivity)]));
  const exportPaddockPDF  = () => downloadPDF('farmmap-paddocks', 'Paddock History', ['Name','Ha','Soil','Status','Current Crop','Last Activity'], paddocks.map(p => [p.name, p.hectares, p.soilType, p.status, p.currentCrop ?? '', formatDate(p.lastActivity)]), `${paddocks.length} paddocks · ${totalHa.toLocaleString()} ha`);
  const exportEquipCSV    = () => downloadCSV('farmmap-equipment', ['Name','Category','Make','Model','Year','Status','Hours/km'], equipment.map(e => [e.name, e.category, e.make, e.model, e.year ?? '', e.status, e.hoursOrKm ?? '']));
  const exportEquipPDF    = () => downloadPDF('farmmap-equipment', 'Equipment & Maintenance', ['Name','Category','Make','Model','Year','Status','Hours/km'], equipment.map(e => [e.name, e.category, e.make, e.model, e.year ?? '', e.status, e.hoursOrKm ?? '']), `${equipment.length} assets`);
  const exportTasksCSV    = () => downloadCSV('farmmap-tasks', ['Title','Status','Priority','Due Date','Assigned To'], tasks.map(t => [t.title, t.status, t.priority, t.dueDate ?? '', t.assignedTo ?? '']));
  const exportTasksPDF    = () => downloadPDF('farmmap-tasks', 'Tasks & Work Orders', ['Title','Status','Priority','Due Date','Assigned To'], tasks.map(t => [t.title, t.status.replace('_',' '), t.priority, t.dueDate ?? '', t.assignedTo ?? '']), `${tasks.length} tasks`);
  const exportInventCSV   = () => downloadCSV('farmmap-inventory', ['Item','Category','Qty','Unit','Unit Cost'], inventory.map(i => [i.name, i.category, i.quantity, i.unit, i.costPerUnit ?? '']));
  const exportInventPDF   = () => downloadPDF('farmmap-inventory', 'Inventory & Stores', ['Item','Category','Qty','Unit','Unit Cost'], inventory.map(i => [i.name, i.category, i.quantity, i.unit, i.costPerUnit ?? '']), `${inventory.length} items`);

  const exportAll = () => {
    exportFinanceCSV();
    exportLivestockCSV();
    exportPaddockCSV();
    exportEquipCSV();
    exportTasksCSV();
    exportInventCSV();
  };

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
    { id: 'financial', title: 'Financial Summary',       desc: 'P&L, GST, cash flow',              icon: '💰', onCSV: exportFinanceCSV,   onPDF: exportFinancePDF },
    { id: 'livestock', title: 'Livestock Report',        desc: 'Herd composition, NLIS movements',  icon: '🐑', onCSV: exportLivestockCSV, onPDF: exportLivestockPDF },
    { id: 'paddock',   title: 'Paddock History',         desc: 'Crop rotation, grazing records',    icon: '🗺️', onCSV: exportPaddockCSV,   onPDF: exportPaddockPDF },
    { id: 'equipment', title: 'Equipment & Maintenance', desc: 'Asset register, service history',   icon: '🚜', onCSV: exportEquipCSV,     onPDF: exportEquipPDF },
    { id: 'tasks',     title: 'Tasks & Work Orders',     desc: 'All farm tasks and work orders',    icon: '✅', onCSV: exportTasksCSV,     onPDF: exportTasksPDF },
    { id: 'inventory', title: 'Inventory & Stores',      desc: 'Chemicals, seed, fuel, feed',       icon: '📦', onCSV: exportInventCSV,    onPDF: exportInventPDF },
    { id: 'crops',     title: 'Crop & Agronomy',         desc: 'Crop records, yields, spray diary', icon: '🌾', onCSV: exportPaddockCSV,   onPDF: exportPaddockPDF },
    { id: 'rainfall',  title: 'Rainfall & Weather',      desc: 'Monthly rainfall vs average',       icon: '🌧️', onCSV: exportPaddockCSV,  onPDF: exportPaddockPDF },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Farm performance, compliance, and export-ready reports"
        actions={
          <ExportMenu onCSV={exportAll} onPDF={exportFinancePDF} className="mr-0" />
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
            <div key={r.id} className="card hover:shadow-md transition-shadow group">
              <div className="text-3xl mb-3">{r.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-farm-700 transition-colors text-sm">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">{r.desc}</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={r.onCSV} className="flex-1 btn-secondary text-xs py-1.5">CSV</button>
                <button onClick={r.onPDF} className="flex-1 btn-secondary text-xs py-1.5"><FileText className="w-3 h-3 inline mr-1" />PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
