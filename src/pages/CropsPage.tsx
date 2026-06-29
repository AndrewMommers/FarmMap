import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { useFarmData } from '../hooks/useFarmData';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Sprout, Droplets } from 'lucide-react';

export function CropsPage() {
  const { crops, sprayRecords, paddocks } = useFarmData();
  const [tab, setTab] = useState<'crops' | 'spray'>('crops');
  const [search, setSearch] = useState('');

  const activeCrops = crops.filter(c => c.status === 'growing' || c.status === 'planted');
  const harvestedCrops = crops.filter(c => c.status === 'harvested');

  const getPaddock = (id: string) => paddocks.find(p => p.id === id)?.name ?? '—';

  const filteredCrops = crops.filter(c =>
    c.cropName.toLowerCase().includes(search.toLowerCase()) ||
    getPaddock(c.paddockId).toLowerCase().includes(search.toLowerCase())
  );

  const filteredSpray = sprayRecords.filter(s =>
    s.product.toLowerCase().includes(search.toLowerCase()) ||
    getPaddock(s.paddockId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crops & Agronomy"
        subtitle="Crop records, spray logs & paddock history"
        actions={
          <button className="btn-primary" onClick={() => toast.success('New crop record – coming in full release')}>
            <Plus className="w-4 h-4" /> New Crop Record
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Crops" value={activeCrops.length} icon={<Sprout className="w-5 h-5" />} color="green" />
        <StatCard title="Total Planted" value={`${crops.filter(c => c.status !== 'failed').reduce((s, c) => {
          const p = paddocks.find(p => p.id === c.paddockId);
          return s + (p?.hectares ?? 0);
        }, 0)} ha`} icon={<Sprout className="w-5 h-5" />} color="blue" />
        <StatCard title="Harvested" value={harvestedCrops.length} subtitle="This season" icon={<Sprout className="w-5 h-5" />} color="purple" />
        <StatCard title="Spray Events" value={sprayRecords.length} subtitle="This season" icon={<Droplets className="w-5 h-5" />} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
          <button onClick={() => setTab('crops')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'crops' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}>Crop Records</button>
          <button onClick={() => setTab('spray')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'spray' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}>Spray Log</button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search…" className="w-48 ml-auto" />
      </div>

      {tab === 'crops' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCrops.map((c) => {
            const paddock = paddocks.find(p => p.id === c.paddockId);
            return (
              <div key={c.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{c.cropName}</h3>
                    {c.variety && <p className="text-xs text-gray-400">{c.variety}</p>}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Paddock</span><span className="font-medium">{getPaddock(c.paddockId)}</span></div>
                  {paddock && <div className="flex justify-between"><span className="text-gray-500">Area</span><span>{paddock.hectares} ha</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Season</span><span>{c.season}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Planted</span><span>{formatDate(c.plantingDate)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Est. harvest</span><span>{formatDate(c.expectedHarvestDate)}</span></div>
                  {c.expectedYieldTonnesHa && <div className="flex justify-between"><span className="text-gray-500">Target yield</span><span className="text-farm-700 font-medium">{c.expectedYieldTonnesHa} t/ha</span></div>}
                  {c.actualYieldTonnesHa && <div className="flex justify-between"><span className="text-gray-500">Actual yield</span><span className="font-bold text-farm-800">{c.actualYieldTonnesHa} t/ha</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Irrigated</span><span>{c.irrigated ? '✓ Yes' : 'Dryland'}</span></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => toast('Spray log – see spray tab')}>Spray Log</button>
                  <button className="flex-1 btn-secondary text-xs py-1.5" onClick={() => toast('Yield entry – coming soon')}>Record Yield</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {['Date', 'Paddock', 'Product', 'Rate/ha', 'Unit', 'Purpose', 'Operator', 'WHP (days)', 'Notes'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSpray.map((s) => (
                <tr key={s.id} className="hover:bg-farm-50/50 transition-colors">
                  <td className="table-cell">{formatDate(s.date)}</td>
                  <td className="table-cell font-medium">{getPaddock(s.paddockId)}</td>
                  <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{s.product}</td>
                  <td className="table-cell">{s.ratePerHa}</td>
                  <td className="table-cell">{s.unit}</td>
                  <td className="table-cell capitalize"><StatusBadge status={s.purpose === 'herbicide' ? 'active' : 'planned'} label={s.purpose} /></td>
                  <td className="table-cell">{s.operator}</td>
                  <td className="table-cell">{s.withholdingDays ?? '—'}</td>
                  <td className="table-cell text-xs text-gray-400">{s.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
