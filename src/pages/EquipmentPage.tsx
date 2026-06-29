import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { AddEquipmentModal } from '../components/modals/AddEquipmentModal';
import { useFarmData } from '../hooks/useFarmData';
import { formatDate, formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Wrench, AlertTriangle } from 'lucide-react';

export function EquipmentPage() {
  const { equipment, maintenanceLogs } = useFarmData();
  const [tab, setTab] = useState<'fleet' | 'maintenance'>('fleet');
  const [search, setSearch] = useState('');
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  const operational = equipment.filter(e => e.status === 'operational').length;
  const inMaintenance = equipment.filter(e => e.status === 'maintenance' || e.status === 'repair').length;

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.make.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const categoryIcon: Record<string, string> = {
    tractor: '🚜', harvester: '🌾', sprayer: '💧', vehicle: '🚗',
    irrigation: '💦', planter: '🌱', pump: '⚙️', shed: '🏚️', other: '🔧',
  };

  return (
    <div className="space-y-6">
      <AddEquipmentModal open={showAddEquipment} onClose={() => setShowAddEquipment(false)} />
      <PageHeader
        title="Equipment & Fleet"
        subtitle="Machinery, vehicles, and maintenance records"
        actions={
          <button className="btn-primary" onClick={() => setShowAddEquipment(true)}>
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={equipment.length} icon={<Wrench className="w-5 h-5" />} color="blue" />
        <StatCard title="Operational" value={operational} icon={<Wrench className="w-5 h-5" />} color="green" />
        <StatCard title="Needs Attention" value={inMaintenance} icon={<AlertTriangle className="w-5 h-5" />} color={inMaintenance > 0 ? 'red' : 'green'} />
        <StatCard title="Fleet Value" value={formatCurrency(equipment.reduce((s, e) => s + (e.purchasePriceAUD ?? 0), 0))} icon={<Wrench className="w-5 h-5" />} color="purple" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
          <button onClick={() => setTab('fleet')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'fleet' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}>Fleet</button>
          <button onClick={() => setTab('maintenance')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'maintenance' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}>Maintenance Log</button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search equipment…" className="w-48 ml-auto" />
      </div>

      {tab === 'fleet' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <div key={e.id} className={`card hover:shadow-md transition-shadow ${e.status === 'maintenance' || e.status === 'repair' ? 'border-amber-200 bg-amber-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcon[e.category] ?? '🔧'}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{e.name}</h3>
                    <p className="text-xs text-gray-400">{e.year} · {e.make} {e.model}</p>
                  </div>
                </div>
                <StatusBadge status={e.status} />
              </div>
              <div className="space-y-1.5 text-sm">
                {e.serialNumber && <div className="flex justify-between"><span className="text-gray-500">Serial</span><span className="font-mono text-xs">{e.serialNumber}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Last service</span><span>{formatDate(e.lastServiceDate)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Next service</span><span className={e.nextServiceDate && new Date(e.nextServiceDate) < new Date() ? 'text-red-600 font-semibold' : ''}>{formatDate(e.nextServiceDate)}</span></div>
                {e.hoursOrKm && <div className="flex justify-between"><span className="text-gray-500">Hours / km</span><span className="font-medium">{e.hoursOrKm.toLocaleString()}</span></div>}
                {e.purchasePriceAUD && <div className="flex justify-between"><span className="text-gray-500">Purchase price</span><span>{formatCurrency(e.purchasePriceAUD)}</span></div>}
              </div>
              {e.notes && <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">{e.notes}</p>}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => toast('Service record – coming soon')}>Log Service</button>
                <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => toast('Edit equipment – coming soon')}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                {['Date', 'Equipment', 'Type', 'Description', 'Cost', 'Technician', 'Next Due'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((log) => {
                const eq = equipment.find(e => e.id === log.equipmentId);
                return (
                  <tr key={log.id} className="hover:bg-farm-50/50 transition-colors">
                    <td className="table-cell">{formatDate(log.date)}</td>
                    <td className="table-cell font-medium">{eq?.name ?? '—'}</td>
                    <td className="table-cell capitalize"><StatusBadge status={log.type === 'service' ? 'active' : log.type === 'repair' ? 'repair' : 'planned'} label={log.type} /></td>
                    <td className="table-cell text-gray-600 dark:text-gray-400 max-w-xs">{log.description}</td>
                    <td className="table-cell font-semibold">{log.costAUD ? formatCurrency(log.costAUD) : '—'}</td>
                    <td className="table-cell">{log.technician ?? '—'}</td>
                    <td className="table-cell">{formatDate(log.nextDueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
