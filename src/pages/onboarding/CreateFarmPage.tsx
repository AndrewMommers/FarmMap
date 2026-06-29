import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import type { FarmType, State } from '../../types';
import { Wheat, MapPin, Loader2 } from 'lucide-react';

const FARM_TYPES: { value: FarmType; label: string }[] = [
  { value: 'mixed',       label: 'Mixed Farming' },
  { value: 'livestock',   label: 'Livestock' },
  { value: 'cropping',    label: 'Cropping / Grain' },
  { value: 'dairy',       label: 'Dairy' },
  { value: 'horticulture',label: 'Horticulture' },
  { value: 'vineyard',    label: 'Vineyard / Wine' },
  { value: 'poultry',     label: 'Poultry' },
  { value: 'aquaculture', label: 'Aquaculture' },
  { value: 'sugar',       label: 'Sugar Cane' },
  { value: 'cotton',      label: 'Cotton' },
];

const STATES: State[] = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

export function CreateFarmPage() {
  const { user } = useAuthStore();
  const { addFarm, loadFromSupabase } = useDataStore();

  const [form, setForm] = useState({
    name: '',
    type: 'mixed' as FarmType,
    state: 'NSW' as State,
    region: '',
    address: '',
    totalHectares: '',
    owner: '',
    abn: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Farm name is required'); return; }
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      await addFarm(user.id, {
        name:          form.name.trim(),
        type:          form.type,
        state:         form.state,
        region:        form.region,
        address:       form.address,
        totalHectares: parseFloat(form.totalHectares) || 0,
        owner:         (form.owner || user.email) ?? 'Owner',
        abn:           form.abn,
      });
      // Reload full dataset now that a farm exists
      await loadFromSupabase(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create farm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-farm-900 via-farm-800 to-earth-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-500 mb-4 shadow-lg">
            <Wheat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Property</h1>
          <p className="text-farm-300 mt-1">You can add more properties later from Settings</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Property Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Riverdale Station"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Farm Type</label>
                <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {FARM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">State</label>
                <select className="input" value={form.state} onChange={(e) => set('state', e.target.value)}>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Region</label>
                <input
                  className="input"
                  placeholder="e.g. Riverina, Wimmera"
                  value={form.region}
                  onChange={(e) => set('region', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Total Area (ha)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={form.totalHectares}
                  onChange={(e) => set('totalHectares', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="label"><MapPin className="w-3.5 h-3.5 inline mr-1" />Address / Nearest town</label>
                <input
                  className="input"
                  placeholder="e.g. 1234 Pastoral Way, Hillston NSW 2675"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Owner / Operator</label>
                <input
                  className="input"
                  placeholder="Your name or company"
                  value={form.owner}
                  onChange={(e) => set('owner', e.target.value)}
                />
              </div>
              <div>
                <label className="label">ABN (optional)</label>
                <input
                  className="input"
                  placeholder="XX XXX XXX XXX"
                  value={form.abn}
                  onChange={(e) => set('abn', e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Property & Get Started'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
