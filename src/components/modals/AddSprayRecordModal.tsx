import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import type { Paddock } from '../../types';
import toast from 'react-hot-toast';

interface AddSprayRecordModalProps {
  open: boolean;
  onClose: () => void;
  paddock?: Paddock;
}

const PURPOSES = ['herbicide', 'fungicide', 'insecticide', 'fertiliser'];
const UNITS = ['L/ha', 'kg/ha', 'mL/ha', 'g/ha'];

export function AddSprayRecordModal({ open, onClose, paddock }: AddSprayRecordModalProps) {
  const { activeFarmId } = useAppStore();
  const addSprayRecord = useDataStore((s) => s.addSprayRecord);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10), product: '', ratePerHa: '', unit: 'L/ha',
    operator: '', withholdingDays: '', purpose: 'herbicide', notes: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm({ date: new Date().toISOString().slice(0, 10), product: '', ratePerHa: '', unit: 'L/ha', operator: '', withholdingDays: '', purpose: 'herbicide', notes: '' });
    }
  }, [open]);

  const handleSave = () => {
    if (!paddock) return;
    if (!form.product.trim()) { toast.error('Product name is required'); return; }
    if (!form.ratePerHa || Number.isNaN(Number(form.ratePerHa))) { toast.error('Enter a valid application rate'); return; }
    addSprayRecord(activeFarmId, {
      paddockId: paddock.id,
      date: form.date,
      product: form.product,
      ratePerHa: Number(form.ratePerHa),
      unit: form.unit,
      operator: form.operator || 'Unassigned',
      withholdingDays: form.withholdingDays ? Number(form.withholdingDays) : undefined,
      purpose: form.purpose,
      notes: form.notes || undefined,
    });
    toast.success(`Spray record added for ${paddock.name}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={paddock ? `Spray Record — ${paddock.name}` : 'Spray Record'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Record</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Purpose</label>
            <select className="input" value={form.purpose} onChange={(e) => set('purpose', e.target.value)}>
              {PURPOSES.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Product *</label>
          <input className="input" placeholder="e.g. Glyphosate 450" value={form.product} onChange={(e) => set('product', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Rate *</label>
            <input className="input" type="number" step="0.1" placeholder="e.g. 2" value={form.ratePerHa} onChange={(e) => set('ratePerHa', e.target.value)} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Operator</label>
            <input className="input" placeholder="Who applied it" value={form.operator} onChange={(e) => set('operator', e.target.value)} />
          </div>
          <div>
            <label className="label">Withholding period (days)</label>
            <input className="input" type="number" placeholder="e.g. 7" value={form.withholdingDays} onChange={(e) => set('withholdingDays', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} placeholder="Weather conditions, tank mix, etc." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
