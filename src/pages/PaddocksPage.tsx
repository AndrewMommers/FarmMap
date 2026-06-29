import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { FarmMapSVG } from '../components/map/FarmMapSVG';
import { AddPaddockModal } from '../components/modals/AddPaddockModal';
import { useFarmData } from '../hooks/useFarmData';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, MapPin, Droplets, Map, LayoutGrid } from 'lucide-react';

export function PaddocksPage() {
  const { paddocks } = useFarmData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [selectedPaddock, setSelectedPaddock] = useState<string | undefined>();
  const [showAddPaddock, setShowAddPaddock] = useState(false);

  const filtered = paddocks.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.currentCrop ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalHa = filtered.reduce((s, p) => s + p.hectares, 0);
  const statusCounts = {
    active: paddocks.filter((p) => p.status === 'active').length,
    fallow: paddocks.filter((p) => p.status === 'fallow').length,
    harvested: paddocks.filter((p) => p.status === 'harvested').length,
  };

  const selected = paddocks.find((p) => p.id === selectedPaddock);

  return (
    <div className="space-y-6">
      <AddPaddockModal open={showAddPaddock} onClose={() => setShowAddPaddock(false)} />
      <PageHeader
        title="Paddocks & Fields"
        subtitle={`${paddocks.length} paddocks · ${paddocks.reduce((s, p) => s + p.hectares, 0).toLocaleString()} ha total`}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${view === 'grid' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${view === 'map' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}
              >
                <Map className="w-3.5 h-3.5" /> Map
              </button>
            </div>
            <button className="btn-primary" onClick={() => setShowAddPaddock(true)}>
              <Plus className="w-4 h-4" /> Add Paddock
            </button>
          </div>
        }
      />

      {/* Status filters + search */}
      <div className="flex flex-wrap gap-3 items-center">
        {[
          { key: 'all', label: 'All', count: paddocks.length },
          { key: 'active', label: 'Active', count: statusCounts.active },
          { key: 'fallow', label: 'Fallow', count: statusCounts.fallow },
          { key: 'harvested', label: 'Harvested', count: statusCounts.harvested },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              filterStatus === f.key
                ? 'bg-farm-700 text-white border-farm-700'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-farm-300'
            }`}
          >
            {f.label} <span className="ml-1 opacity-70">({f.count})</span>
          </button>
        ))}
        <div className="ml-auto">
          <SearchBar value={search} onChange={setSearch} placeholder="Search paddocks…" className="w-52" />
        </div>
      </div>

      {view === 'map' ? (
        /* ── MAP VIEW ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-2 overflow-hidden" style={{ minHeight: 480 }}>
            <FarmMapSVG
              paddocks={paddocks}
              selectedId={selectedPaddock}
              onSelect={(id) => setSelectedPaddock(id === selectedPaddock ? undefined : id)}
            />
          </div>

          {/* Side panel */}
          <div className="card space-y-4 overflow-y-auto max-h-[520px]">
            {selected ? (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{selected.name}</h3>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="font-semibold">{selected.hectares} ha</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Soil type</span><span>{selected.soilType}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Current crop</span><span className="text-farm-700 font-medium">{selected.currentCrop ?? 'None'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Last activity</span><span>{formatDate(selected.lastActivity)}</span></div>
                </div>
                {selected.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{selected.notes}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 btn-secondary text-xs py-2" onClick={() => toast('Paddock log – coming soon', { icon: '📋' })}>View Log</button>
                  <button className="flex-1 btn-secondary text-xs py-2" onClick={() => toast('Spray record – coming soon', { icon: '💧' })}><Droplets className="w-3 h-3" /> Spray</button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Map className="w-10 h-10 mx-auto mb-3 text-farm-200" />
                <p className="text-sm font-medium">Click a paddock on the map to view details</p>
                <div className="mt-4 space-y-2">
                  {paddocks.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPaddock(p.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-farm-50 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <StatusBadge status={p.status} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── GRID VIEW ────────────────────────────────────────────────── */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className={`card hover:shadow-md transition-all cursor-pointer group ${selectedPaddock === p.id ? 'ring-2 ring-farm-500' : ''}`}
                onClick={() => setSelectedPaddock(p.id === selectedPaddock ? undefined : p.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-farm-700 transition-colors">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{p.soilType}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="font-semibold">{p.hectares} ha</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Current use</span><span className="font-medium text-farm-700">{p.currentCrop ?? 'None'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Last activity</span><span className="text-gray-400">{formatDate(p.lastActivity)}</span></div>
                </div>
                {p.notes && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">{p.notes}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 btn-secondary text-xs py-1.5" onClick={(e) => { e.stopPropagation(); toast('Paddock log – coming soon', { icon: '📋' }); }}>
                    View Log
                  </button>
                  <button className="flex-1 btn-secondary text-xs py-1.5" onClick={(e) => { e.stopPropagation(); toast('Spray record – coming soon', { icon: '💧' }); }}>
                    <Droplets className="w-3 h-3" /> Spray
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="card text-center py-12 text-gray-400">No paddocks match your search.</div>
          )}
          <div className="text-sm text-gray-400 font-medium">
            Showing {filtered.length} paddocks · {totalHa.toLocaleString()} ha
          </div>
        </>
      )}
    </div>
  );
}
