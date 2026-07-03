import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { SortableHeader } from '../components/ui/SortableHeader';
import { AddEquipmentModal } from '../components/modals/AddEquipmentModal';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { formatDate, formatCurrency } from '../lib/utils';
import { useTableSort, applySortFn } from '../hooks/useTableSort';
import toast from 'react-hot-toast';
import { Plus, Wrench, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import type { Equipment } from '../types';

export function EquipmentPage() {
  const { equipment, maintenanceLogs } = useFarmData();
  const deleteEquipment = useDataStore((s) => s.deleteEquipment);
  const [tab, setTab] = useState<'fleet' | 'maintenance'>('fleet');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const { sort: fleetSort, onSort: onFleetSort } = useTableSort('name', 'asc');
  const { sort: logSort, onSort: onLogSort } = useTableSort('date', 'desc');

  const operational = equipment.filter(e => e.status === 'operational').length;
  const inMaintenance = equipment.filter(e => e.status === 'maintenance' || e.status === 'repair').length;

  const filtered = applySortFn(
    equipment.filter(e =>
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
       e.make.toLowerCase().includes(search.toLowerCase()) ||
       e.category.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === 'all' || e.status === statusFilter)
    ),
    fleetSort,
    {
      name:     (e) => e.name.toLowerCase(),
      category: (e) => e.category,
      status:   (e) => e.status,
      year:     (e) => e.year ?? 0,
    }
  );

  const sortedLogs = applySortFn(
    maintenanceLogs,
    logSort,
    {
      date:     (l) => l.date,
      equipment:(l) => equipment.find(e => e.id === l.equipmentId)?.name.toLowerCase() ?? '',
      type:     (l) => l.type,
      cost:     (l) => l.costAUD ?? 0,
      nextDue:  (l) => l.nextDueDate ?? '',
    }
  );

  const categoryIcon: Record<string, string> = {
    tractor: '🚜', harvester: '🌾', sprayer: '💧', vehicle: '🚗',
    irrigation: '💦', planter: '🌱', pump: '⚙️', shed: '🏚️', other: '🔧',
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteEquipment(id);
    toast.success('Equipment deleted');
  };

  return (
    <div className="space-y-6">
      <AddEquipmentModal open={showAddEquipment || !!editingEquipment} onClose={() => { setShowAddEquipment(false); setEditingEquipment(undefined); }} initialData={editingEquipment} />
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
        {(['all', 'operational', 'maintenance', 'repair'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        {tab === 'fleet' && (
          <select
            value={fleetSort.key}
            onChange={(e) => onFleetSort(e.target.value)}
            className="input text-sm py-1.5 w-36"
          >
            <option value="name">Sort: Name</option>
            <option value="category">Sort: Category</option>
            <option value="status">Sort: Status</option>
            <option value="year">Sort: Year</option>
          </select>
        )}
        <SearchBar value={search} onChange={setSearch} placeholder="Search equipment…" className="w-44 ml-auto" />
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
                <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => setEditingEquipment(e)}><Pencil className="w-3 h-3 mr-1 inline" />Edit</button>
                <button className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0" title="Delete equipment" onClick={() => handleDelete(e.id, e.name)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <SortableHeader label="Date"      sortKey="date"      sort={logSort} onSort={onLogSort} />
                <SortableHeader label="Equipment" sortKey="equipment" sort={logSort} onSort={onLogSort} />
                <SortableHeader label="Type"      sortKey="type"      sort={logSort} onSort={onLogSort} />
                <th className="table-header">Description</th>
                <SortableHeader label="Cost"      sortKey="cost"      sort={logSort} onSort={onLogSort} />
                <th className="table-header">Technician</th>
                <SortableHeader label="Next Due"  sortKey="nextDue"   sort={logSort} onSort={onLogSort} />
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => {
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
