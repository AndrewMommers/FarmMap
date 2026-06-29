import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { AddInventoryItemModal } from '../components/modals/AddInventoryItemModal';
import { useFarmData } from '../hooks/useFarmData';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import type { InventoryCategory } from '../types';

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  chemical: 'Chemical/Ag', fertiliser: 'Fertiliser', seed: 'Seed',
  feed: 'Stock Feed', fuel: 'Fuel', parts: 'Parts', other: 'Other',
};

const CATEGORY_COLORS: Record<InventoryCategory, string> = {
  chemical: 'bg-orange-100 text-orange-800',
  fertiliser: 'bg-green-100 text-green-800',
  seed: 'bg-yellow-100 text-yellow-800',
  feed: 'bg-amber-100 text-amber-800',
  fuel: 'bg-blue-100 text-blue-800',
  parts: 'bg-gray-100 text-gray-700',
  other: 'bg-purple-100 text-purple-800',
};

export function InventoryPage() {
  const { inventory } = useFarmData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddItem, setShowAddItem] = useState(false);

  const lowStock = inventory.filter(i => i.minStockLevel !== undefined && i.quantity <= i.minStockLevel);
  const totalValue = inventory.reduce((s, i) => s + (i.costPerUnit ?? 0) * i.quantity, 0);

  const filtered = inventory.filter(i => {
    const q = i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.location ?? '').toLowerCase().includes(search.toLowerCase());
    const cat = categoryFilter === 'all' || i.category === categoryFilter;
    return q && cat;
  });

  const categories = Array.from(new Set(inventory.map(i => i.category)));

  return (
    <div className="space-y-6">
      <AddInventoryItemModal open={showAddItem} onClose={() => setShowAddItem(false)} />
      <PageHeader
        title="Inventory & Stores"
        subtitle="Chemicals, seed, fertiliser, fuel, feed & parts"
        actions={
          <button className="btn-primary" onClick={() => setShowAddItem(true)}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total SKUs" value={inventory.length} icon={<Package className="w-5 h-5" />} color="blue" />
        <StatCard title="Inventory Value" value={formatCurrency(totalValue)} icon={<Package className="w-5 h-5" />} color="green" />
        <StatCard title="Low Stock Alerts" value={lowStock.length} icon={<AlertTriangle className="w-5 h-5" />} color={lowStock.length > 0 ? 'red' : 'green'} />
        <StatCard title="Categories" value={categories.length} icon={<Package className="w-5 h-5" />} color="purple" />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Low Stock Alerts ({lowStock.length} items)</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(item => (
              <span key={item.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-medium">
                {item.name} – {item.quantity} {item.unit} remaining
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${categoryFilter === 'all' ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'}`}>All</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${categoryFilter === cat ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'}`}>
            {CATEGORY_LABELS[cat as InventoryCategory] ?? cat}
          </button>
        ))}
        <SearchBar value={search} onChange={setSearch} placeholder="Search inventory…" className="w-48 ml-auto" />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr>
              {['Item', 'Category', 'Qty', 'Unit', 'Min Stock', 'Location', 'Unit Cost', 'Total Value', 'Expiry'].map(h => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isLow = item.minStockLevel !== undefined && item.quantity <= item.minStockLevel;
              return (
                <tr key={item.id} className={`hover:bg-farm-50/50 transition-colors ${isLow ? 'bg-red-50/40' : ''}`}>
                  <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">
                    {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline mr-1" />}
                    {item.name}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${CATEGORY_COLORS[item.category as InventoryCategory]}`}>
                      {CATEGORY_LABELS[item.category as InventoryCategory] ?? item.category}
                    </span>
                  </td>
                  <td className={`table-cell font-bold ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>{item.quantity.toLocaleString()}</td>
                  <td className="table-cell">{item.unit}</td>
                  <td className="table-cell text-gray-400">{item.minStockLevel ?? '—'}</td>
                  <td className="table-cell">{item.location ?? '—'}</td>
                  <td className="table-cell">{item.costPerUnit ? formatCurrency(item.costPerUnit) : '—'}</td>
                  <td className="table-cell font-semibold">{item.costPerUnit ? formatCurrency(item.costPerUnit * item.quantity) : '—'}</td>
                  <td className="table-cell text-xs">{formatDate(item.expiryDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
