import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import type { Paddock } from '../../types';
import toast from 'react-hot-toast';

interface AddPaddockModalProps {
  open: boolean;
  onClose: () => void;
}

const SOIL_TYPES = [
  'Red Kandosol', 'Grey Vertosol', 'Black Vertosol', 'Red Sodosol',
  'Red Earth', 'Red Chromosol', 'Sandy loam', 'Mitchell grass', 'Clay loam', 'Other',
];

export function AddPaddockModal({ open, onClose }: AddPaddockModalProps) {
  const { activeFarmId } = useAppStore();
  const addPaddock = useDataStore((s) => s.addPaddock);
  const [form, setForm] = useState({
    name: '', hectares: '', soilType: 'Red Kandosol',
    status: 'active', currentCrop: '', notes: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.hectares) {
      toast.error('Name and area are required');
      return;
    }
    addPaddock(activeFarmId, {
      name: form.name,
      hectares: parseFloat(form.hectares),
      soilType: form.soilType,
      status: form.status as Paddock['status'],
      currentCrop: form.currentCrop || undefined,
      notes: form.notes || undefined,
      lastActivity: new Date().toISOString().slice(0, 10),
    });
    toast.success(`Paddock "${form.name}" added!`);
    onClose();
    setForm({ name: '', hectares: '', soilType: 'Red Kandosol', status: 'active', currentCrop: '', notes: '' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Paddock"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Paddock</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Paddock Name *</label>
            <input className="input" placeholder="e.g. North Flat" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Area (hectares) *</label>
            <input className="input" type="number" min="0" step="0.1" placeholder="0.0" value={form.hectares} onChange={(e) => set('hectares', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="fallow">Fallow</option>
              <option value="harvested">Harvested</option>
              <option value="locked">Locked</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Soil Type</label>
            <select className="input" value={form.soilType} onChange={(e) => set('soilType', e.target.value)}>
              {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Current Crop / Use</label>
            <input className="input" placeholder="e.g. Winter Wheat, Pasture, Lucerne" value={form.currentCrop} onChange={(e) => set('currentCrop', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} placeholder="Any additional notes…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
