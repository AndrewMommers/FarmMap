import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import type { EquipmentCategory, EquipmentStatus } from '../../types';
import toast from 'react-hot-toast';

interface AddEquipmentModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: 'tractor',    label: 'Tractor' },
  { value: 'harvester',  label: 'Harvester / Header' },
  { value: 'planter',    label: 'Planter / Seeder' },
  { value: 'sprayer',    label: 'Sprayer' },
  { value: 'vehicle',    label: 'Vehicle / Ute' },
  { value: 'pump',       label: 'Pump' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'shed',       label: 'Shed / Infrastructure' },
  { value: 'other',      label: 'Other' },
];

const STATUSES: { value: EquipmentStatus; label: string }[] = [
  { value: 'operational',    label: 'Operational' },
  { value: 'maintenance',    label: 'Scheduled Maintenance' },
  { value: 'repair',         label: 'Under Repair' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const INITIAL = {
  name: '', category: 'tractor' as EquipmentCategory, status: 'operational' as EquipmentStatus,
  make: '', model: '', year: '', serialNumber: '',
  lastServiceDate: '', nextServiceDate: '', hoursOrKm: '',
  purchaseDate: '', purchasePriceAUD: '', notes: '',
};

export function AddEquipmentModal({ open, onClose }: AddEquipmentModalProps) {
  const { activeFarmId } = useAppStore();
  const addEquipment = useDataStore((s) => s.addEquipment);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Equipment name is required'); return; }
    setSaving(true);
    try {
      addEquipment(activeFarmId, {
        name:             form.name.trim(),
        category:         form.category,
        status:           form.status,
        make:             form.make || '',
        model:            form.model || '',
        year:             form.year ? parseInt(form.year, 10) : undefined,
        serialNumber:     form.serialNumber || undefined,
        lastServiceDate:  form.lastServiceDate || undefined,
        nextServiceDate:  form.nextServiceDate || undefined,
        hoursOrKm:        form.hoursOrKm ? parseFloat(form.hoursOrKm) : undefined,
        purchaseDate:     form.purchaseDate || undefined,
        purchasePriceAUD: form.purchasePriceAUD ? parseFloat(form.purchasePriceAUD) : undefined,
        notes:            form.notes || undefined,
      });
      toast.success(`"${form.name}" added to equipment`);
      setForm(INITIAL);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Equipment"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Add Equipment'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Equipment Name *</label>
          <input className="input" placeholder="e.g. John Deere 8R 410" value={form.name}
            onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Make</label>
            <input className="input" placeholder="e.g. John Deere" value={form.make}
              onChange={(e) => set('make', e.target.value)} />
          </div>
          <div>
            <label className="label">Model</label>
            <input className="input" placeholder="e.g. 8R 410" value={form.model}
              onChange={(e) => set('model', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Year</label>
            <input className="input" type="number" min="1950" max="2100" placeholder="e.g. 2022"
              value={form.year} onChange={(e) => set('year', e.target.value)} />
          </div>
          <div>
            <label className="label">Serial / Rego Number</label>
            <input className="input" placeholder="Optional" value={form.serialNumber}
              onChange={(e) => set('serialNumber', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Hours / KM</label>
            <input className="input" type="number" min="0" placeholder="Current reading"
              value={form.hoursOrKm} onChange={(e) => set('hoursOrKm', e.target.value)} />
          </div>
          <div>
            <label className="label">Purchase Price (AUD)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.purchasePriceAUD} onChange={(e) => set('purchasePriceAUD', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Last Service Date</label>
            <input className="input" type="date" value={form.lastServiceDate}
              onChange={(e) => set('lastServiceDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Next Service Date</label>
            <input className="input" type="date" value={form.nextServiceDate}
              onChange={(e) => set('nextServiceDate', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} placeholder="Optional notes…"
            value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
