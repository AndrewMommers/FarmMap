import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { SortableHeader } from '../components/ui/SortableHeader';
import { AddInventoryItemModal } from '../components/modals/AddInventoryItemModal';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { useTableSort, applySortFn } from '../hooks/useTableSort';
import toast from 'react-hot-toast';
import { Plus, Package, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import type { InventoryCategory, InventoryItem } from '../types';

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
  const deleteInventoryItem = useDataStore((s) => s.deleteInventoryItem);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const { sort, onSort } = useTableSort('name', 'asc');

  const lowStock = inventory.filter(i => i.minStockLevel !== undefined && i.quantity <= i.minStockLevel);
  const totalValue = inventory.reduce((s, i) => s + (i.costPerUnit ?? 0) * i.quantity, 0);

  const filtered = applySortFn(
    inventory.filter(i => {
      const q = i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.location ?? '').toLowerCase().includes(search.toLowerCase());
      const cat = categoryFilter === 'all' || i.category === categoryFilter;
      const low = !lowStockOnly || (i.minStockLevel !== undefined && i.quantity <= i.minStockLevel);
      return q && cat && low;
    }),
    sort,
    {
      name:       (i) => i.name.toLowerCase(),
      category:   (i) => CATEGORY_LABELS[i.category as InventoryCategory] ?? i.category,
      quantity:   (i) => i.quantity,
      unitCost:   (i) => i.costPerUnit ?? 0,
      totalValue: (i) => (i.costPerUnit ?? 0) * i.quantity,
      expiry:     (i) => i.expiryDate ?? '',
    }
  );

  const categories = Array.from(new Set(inventory.map(i => i.category)));

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from inventory? This cannot be undone.`)) return;
    deleteInventoryItem(id);
    toast.success('Item deleted');
  };

  return (
    <div className="space-y-6">
      <AddInventoryItemModal open={showAddItem || !!editingItem} onClose={() => { setShowAddItem(false); setEditingItem(undefined); }} initialData={editingItem} />
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
        <button
          onClick={() => setLowStockOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-1.5 ${lowStockOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-400'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only
        </button>
        <SearchBar value={search} onChange={setSearch} placeholder="Search inventory…" className="w-44 ml-auto" />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr>
              <SortableHeader label="Item"        sortKey="name"       sort={sort} onSort={onSort} />
              <SortableHeader label="Category"    sortKey="category"   sort={sort} onSort={onSort} />
              <SortableHeader label="Qty"         sortKey="quantity"   sort={sort} onSort={onSort} />
              <th className="table-header">Unit</th>
              <th className="table-header">Min Stock</th>
              <th className="table-header">Location</th>
              <SortableHeader label="Unit Cost"   sortKey="unitCost"   sort={sort} onSort={onSort} />
              <SortableHeader label="Total Value" sortKey="totalValue" sort={sort} onSort={onSort} />
              <SortableHeader label="Expiry"      sortKey="expiry"     sort={sort} onSort={onSort} />
              <th className="table-header"></th>
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
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button className="p-1 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit item" onClick={() => setEditingItem(item)}><Pencil className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete item" onClick={() => handleDelete(item.id, item.name)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
