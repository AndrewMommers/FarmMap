import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import { useFarmData } from '../../hooks/useFarmData';
import type { CropStatus } from '../../types';
import toast from 'react-hot-toast';

interface AddCropModalProps {
  open: boolean;
  onClose: () => void;
}

const STATUSES: CropStatus[] = ['planned', 'planted', 'growing', 'ready', 'harvested', 'failed'];

function currentSeason(): string {
  const y = new Date().getFullYear();
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

export function AddCropModal({ open, onClose }: AddCropModalProps) {
  const { activeFarmId } = useAppStore();
  const addCrop = useDataStore((s) => s.addCrop);
  const { paddocks } = useFarmData();
  const [form, setForm] = useState({
    paddockId: '', cropName: '', variety: '', season: currentSeason(), status: 'planned' as CropStatus,
    plantingDate: '', expectedHarvestDate: '', seedRateKgHa: '', expectedYieldTonnesHa: '', irrigated: false, notes: '',
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm({
        paddockId: paddocks[0]?.id ?? '', cropName: '', variety: '', season: currentSeason(), status: 'planned',
        plantingDate: '', expectedHarvestDate: '', seedRateKgHa: '', expectedYieldTonnesHa: '', irrigated: false, notes: '',
      });
    }
  }, [open]); // eslint-disable-line

  const handleSave = () => {
    if (!form.paddockId) { toast.error('Select a paddock'); return; }
    if (!form.cropName.trim()) { toast.error('Crop name is required'); return; }
    addCrop(activeFarmId, {
      paddockId: form.paddockId,
      cropName: form.cropName,
      variety: form.variety || undefined,
      season: form.season,
      status: form.status,
      plantingDate: form.plantingDate || undefined,
      expectedHarvestDate: form.expectedHarvestDate || undefined,
      seedRateKgHa: form.seedRateKgHa ? Number(form.seedRateKgHa) : undefined,
      expectedYieldTonnesHa: form.expectedYieldTonnesHa ? Number(form.expectedYieldTonnesHa) : undefined,
      irrigated: form.irrigated,
      notes: form.notes || undefined,
    });
    toast.success(`${form.cropName} added to ${paddocks.find((p) => p.id === form.paddockId)?.name ?? 'paddock'}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Crop Record"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create Record</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Crop *</label>
            <input className="input" placeholder="e.g. Wheat" value={form.cropName} onChange={(e) => set('cropName', e.target.value)} />
          </div>
          <div>
            <label className="label">Variety</label>
            <input className="input" placeholder="e.g. Sunguard" value={form.variety} onChange={(e) => set('variety', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Paddock *</label>
            <select className="input" value={form.paddockId} onChange={(e) => set('paddockId', e.target.value)}>
              <option value="">Select paddock…</option>
              {paddocks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Season</label>
            <input className="input" placeholder="e.g. 2026-27" value={form.season} onChange={(e) => set('season', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as CropStatus)}>
              {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.irrigated} onChange={(e) => set('irrigated', e.target.checked)} className="w-4 h-4 accent-farm-700 rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Irrigated</span>
            </label>
          </div>
          <div>
            <label className="label">Planting date</label>
            <input className="input" type="date" value={form.plantingDate} onChange={(e) => set('plantingDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Expected harvest</label>
            <input className="input" type="date" value={form.expectedHarvestDate} onChange={(e) => set('expectedHarvestDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Seed rate (kg/ha)</label>
            <input className="input" type="number" step="0.1" value={form.seedRateKgHa} onChange={(e) => set('seedRateKgHa', e.target.value)} />
          </div>
          <div>
            <label className="label">Target yield (t/ha)</label>
            <input className="input" type="number" step="0.1" value={form.expectedYieldTonnesHa} onChange={(e) => set('expectedYieldTonnesHa', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
