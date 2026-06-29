import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { AddLivestockModal } from '../components/modals/AddLivestockModal';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Tag, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import type { LivestockMobGroup, LivestockAnimal } from '../types';

export function LivestockPage() {
  const { livestockMobs, livestock, paddocks } = useFarmData();
  const deleteLivestockMob = useDataStore((s) => s.deleteLivestockMob);
  const deleteLivestockAnimal = useDataStore((s) => s.deleteLivestockAnimal);
  const [tab, setTab] = useState<'mobs' | 'individual'>('mobs');
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [showAddLivestock, setShowAddLivestock] = useState(false);
  const [editingMob, setEditingMob] = useState<LivestockMobGroup | undefined>();
  const [editingAnimal, setEditingAnimal] = useState<LivestockAnimal | undefined>();

  const totalCount = livestockMobs.reduce((s, m) => s + m.count, 0);
  const sickCount = livestock.filter((l) => l.status === 'sick' || l.status === 'quarantine').length;

  const filteredMobs = livestockMobs.filter((m) => {
    const s = filterSpecies === 'all' || m.species === filterSpecies;
    const q = m.name.toLowerCase().includes(search.toLowerCase());
    return s && q;
  });

  const filteredAnimals = livestock.filter((a) => {
    const s = filterSpecies === 'all' || a.species === filterSpecies;
    const q = a.tag.toLowerCase().includes(search.toLowerCase()) ||
      a.breed.toLowerCase().includes(search.toLowerCase());
    return s && q;
  });

  const getPaddockName = (id?: string) => paddocks.find((p) => p.id === id)?.name ?? '—';

  const handleDeleteMob = (id: string, name: string) => {
    if (!window.confirm(`Delete mob "${name}"? This cannot be undone.`)) return;
    deleteLivestockMob(id);
    toast.success('Mob deleted');
  };

  const handleDeleteAnimal = (id: string, tag: string) => {
    if (!window.confirm(`Delete animal ${tag}? This cannot be undone.`)) return;
    deleteLivestockAnimal(id);
    toast.success('Animal deleted');
  };

  return (
    <div className="space-y-6">
      <AddLivestockModal
        open={showAddLivestock || !!editingMob || !!editingAnimal}
        onClose={() => { setShowAddLivestock(false); setEditingMob(undefined); setEditingAnimal(undefined); }}
        initialMob={editingMob}
        initialAnimal={editingAnimal}
      />
      <PageHeader
        title="Livestock"
        subtitle="NLIS-compliant herd & mob management"
        actions={
          <button className="btn-primary" onClick={() => setShowAddLivestock(true)}>
            <Plus className="w-4 h-4" /> Add Animals
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Head" value={totalCount.toLocaleString()} subtitle={`${livestockMobs.length} mobs`}
          icon={<Tag className="w-5 h-5" />} color="amber" />
        <StatCard title="Sheep" value={livestockMobs.filter(m => m.species === 'sheep').reduce((s, m) => s + m.count, 0).toLocaleString()}
          subtitle="Merino &amp; wethers" icon={<Tag className="w-5 h-5" />} color="green" />
        <StatCard title="Cattle" value={livestockMobs.filter(m => m.species === 'cattle').reduce((s, m) => s + m.count, 0).toLocaleString()}
          subtitle="Angus breeders &amp; steers" icon={<Tag className="w-5 h-5" />} color="blue" />
        <StatCard title="Health Alerts" value={sickCount} subtitle="Require attention"
          icon={<AlertTriangle className="w-5 h-5" />} color={sickCount > 0 ? 'red' : 'green'} />
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
          {(['mobs', 'individual'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'
              }`}>{t === 'mobs' ? 'Mob Groups' : 'Individual Animals'}</button>
          ))}
        </div>
        {(['all', 'sheep', 'cattle', 'horse', 'goat'] as const).map((sp) => (
          <button key={sp} onClick={() => setFilterSpecies(sp)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
              filterSpecies === sp ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'
            }`}>{sp === 'all' ? 'All Species' : sp}</button>
        ))}
        <SearchBar value={search} onChange={setSearch} placeholder="Search…" className="w-48 ml-auto" />
      </div>

      {/* Content */}
      {tab === 'mobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMobs.map((mob) => (
            <div key={mob.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{mob.name}</h3>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{mob.species}</p>
                </div>
                <span className="text-2xl font-extrabold text-farm-700">{mob.count.toLocaleString()}</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paddock</span>
                  <span className="font-medium">{getPaddockName(mob.paddockId)}</span>
                </div>
              </div>
              {mob.notes && <p className="mt-2 text-xs text-gray-500">{mob.notes}</p>}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => toast('Movement record – coming soon')}>Record Movement</button>
                <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => toast('Treatment record – coming soon')}>Add Treatment</button>
                <button className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0" title="Edit mob" onClick={() => setEditingMob(mob)}><Pencil className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0" title="Delete mob" onClick={() => handleDeleteMob(mob.id, mob.name)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {['NLIS Tag', 'Species', 'Breed', 'Gender', 'DOB', 'Weight', 'Status', 'Paddock', 'Notes', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map((a) => (
                <tr key={a.id} className="hover:bg-farm-50/50 transition-colors">
                  <td className="table-cell font-mono font-medium text-farm-800">{a.tag}</td>
                  <td className="table-cell capitalize">{a.species}</td>
                  <td className="table-cell">{a.breed}</td>
                  <td className="table-cell capitalize">{a.gender}</td>
                  <td className="table-cell">{formatDate(a.dob)}</td>
                  <td className="table-cell">{a.weightKg ? `${a.weightKg} kg` : '—'}</td>
                  <td className="table-cell"><StatusBadge status={a.status} /></td>
                  <td className="table-cell">{getPaddockName(a.paddockId)}</td>
                  <td className="table-cell text-xs text-gray-400 max-w-[160px] truncate">{a.notes ?? '—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button className="p-1 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit animal" onClick={() => setEditingAnimal(a)}><Pencil className="w-3.5 h-3.5" /></button>
                      <button className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete animal" onClick={() => handleDeleteAnimal(a.id, a.tag)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
