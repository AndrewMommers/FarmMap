import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { FarmMapLeaflet } from '../components/map/FarmMapLeaflet';
import type { DrawnFence } from '../components/map/FarmMapLeaflet';
import { AddPaddockModal } from '../components/modals/AddPaddockModal';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import type { Paddock, MapFeatureType } from '../types';
import { Plus, MapPin, Droplets, Map, LayoutGrid, Trash2, Pencil } from 'lucide-react';

export function PaddocksPage() {
  const { paddocks, farm } = useFarmData();
  const { activeFarmId } = useAppStore();
  const deletePaddock    = useDataStore((s) => s.deletePaddock);
  const allFenceLines    = useDataStore((s) => s.fenceLines);
  const allMapFeatures   = useDataStore((s) => s.mapFeatures);
  const addFenceLine     = useDataStore((s) => s.addFenceLine);
  const deleteFenceLine  = useDataStore((s) => s.deleteFenceLine);
  const addMapFeature    = useDataStore((s) => s.addMapFeature);
  const deleteMapFeature = useDataStore((s) => s.deleteMapFeature);

  // Filter in component body — avoids .filter() in selector which breaks React 19 getSnapshot caching
  const fenceLines  = allFenceLines.filter((f) => f.farmId === activeFarmId);
  const mapFeatures = allMapFeatures.filter((f) => f.farmId === activeFarmId);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [selectedPaddock, setSelectedPaddock] = useState<string | undefined>();
  const [showAddPaddock, setShowAddPaddock] = useState(false);
  const [editingPaddock, setEditingPaddock] = useState<Paddock | undefined>();
  const [activeTool, setActiveTool] = useState<'fence' | MapFeatureType | null>(null);

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

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete paddock "${name}"? This cannot be undone.`)) return;
    deletePaddock(id);
    if (selectedPaddock === id) setSelectedPaddock(undefined);
    toast.success('Paddock deleted');
  };

  const handleFenceComplete = (fence: DrawnFence) => {
    const count = fenceLines.length + 1;
    addFenceLine(activeFarmId, { name: `Fence Line ${count}`, points: fence.points, color: fence.color });
    setActiveTool(null);
    toast.success('Fence line saved');
  };

  const FEATURE_LABELS: Record<MapFeatureType, string> = {
    shed: 'Shed', water_trough: 'Water Trough', dam: 'Dam', gate: 'Gate',
  };

  const handleFeaturePlace = (type: MapFeatureType, coords: [number, number]) => {
    const count = mapFeatures.filter((f) => f.type === type).length + 1;
    const name = `${FEATURE_LABELS[type]} ${count}`;
    addMapFeature(activeFarmId, { type, name, coordinates: coords });
    setActiveTool(null);
    toast.success(`${name} placed on map`);
  };

  return (
    <div className="space-y-6">
      <AddPaddockModal open={showAddPaddock || !!editingPaddock} onClose={() => { setShowAddPaddock(false); setEditingPaddock(undefined); }} initialData={editingPaddock} />
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
        <div className="space-y-3">
          {/* Map tools toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">Draw:</span>
            {([
              { key: 'fence',        label: 'Fence Line', emoji: '🪡' },
              { key: 'shed',         label: 'Shed',        emoji: '🏗' },
              { key: 'water_trough', label: 'Trough',      emoji: '💧' },
              { key: 'dam',          label: 'Dam',          emoji: '🌊' },
              { key: 'gate',         label: 'Gate',         emoji: '🔒' },
            ] as { key: 'fence' | MapFeatureType; label: string; emoji: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTool(activeTool === t.key ? null : t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 border ${
                  activeTool === t.key
                    ? 'bg-farm-700 text-white border-farm-700 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-farm-400'
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
            {activeTool && (
              <button
                onClick={() => setActiveTool(null)}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800"
              >
                ✕ Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-farm-100 dark:border-gray-800" style={{ minHeight: 480 }}>
              <FarmMapLeaflet
                paddocks={paddocks}
                fenceLines={fenceLines}
                mapFeatures={mapFeatures}
                selectedId={selectedPaddock}
                onSelect={(id) => setSelectedPaddock(id === selectedPaddock ? undefined : id)}
                address={farm?.address}
                drawTool={activeTool}
                onFenceComplete={handleFenceComplete}
                onFeaturePlace={handleFeaturePlace}
              />
            </div>

            {/* Side panel */}
            <div className="card space-y-4 overflow-y-auto max-h-[560px]">
              {selected ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{selected.name}</h3>
                      {selected.color && (
                        <span className="inline-flex items-center gap-1 mt-1">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.color }} />
                          <span className="text-xs text-gray-400">Paddock colour</span>
                        </span>
                      )}
                    </div>
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
                    <button className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0" title="Edit paddock" onClick={() => setEditingPaddock(selected)}><Pencil className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0" title="Delete paddock" onClick={() => handleDelete(selected.id, selected.name)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Paddocks list */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Paddocks ({paddocks.length})
                    </p>
                    <div className="space-y-1">
                      {paddocks.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPaddock(p.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          {p.color && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{p.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{p.hectares} ha</span>
                          <StatusBadge status={p.status} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fence lines list */}
                  {fenceLines.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">🪡 Fence Lines ({fenceLines.length})</p>
                      <div className="space-y-1">
                        {fenceLines.map((fl) => (
                          <div key={fl.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: fl.color ?? '#78350f' }} />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{fl.name}</span>
                            <button onClick={() => deleteFenceLine(fl.id)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Map features list */}
                  {mapFeatures.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">📍 Map Features ({mapFeatures.length})</p>
                      <div className="space-y-1">
                        {mapFeatures.map((mf) => {
                          const emojiMap: Record<string, string> = { shed: '🏗', water_trough: '💧', dam: '🌊', gate: '🔒' };
                          return (
                            <div key={mf.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                              <span className="text-sm">{emojiMap[mf.type]}</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{mf.name}</span>
                              <button onClick={() => deleteMapFeature(mf.id)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {fenceLines.length === 0 && mapFeatures.length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-2">Use the toolbar above to draw fences and place features</p>
                  )}
                </div>
              )}
            </div>
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
                  <button className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0" title="Edit paddock" onClick={(e) => { e.stopPropagation(); setEditingPaddock(p); }}><Pencil className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0" title="Delete paddock" onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}><Trash2 className="w-4 h-4" /></button>
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
