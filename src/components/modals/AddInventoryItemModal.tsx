import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import type { InventoryCategory, InventoryUnit } from '../../types';
import toast from 'react-hot-toast';

interface AddInventoryItemModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'chemical',    label: 'Chemical / Ag' },
  { value: 'fertiliser',  label: 'Fertiliser' },
  { value: 'seed',        label: 'Seed' },
  { value: 'feed',        label: 'Stock Feed' },
  { value: 'fuel',        label: 'Fuel' },
  { value: 'parts',       label: 'Parts & Consumables' },
  { value: 'other',       label: 'Other' },
];

const UNITS: InventoryUnit[] = ['kg', 'L', 'tonne', 'bag', 'bale', 'unit', 'm'];

const INITIAL = {
  name: '', category: 'chemical' as InventoryCategory, unit: 'L' as InventoryUnit,
  quantity: '', minStockLevel: '', location: '', supplier: '',
  costPerUnit: '', expiryDate: '', notes: '',
};

export function AddInventoryItemModal({ open, onClose }: AddInventoryItemModalProps) {
  const { activeFarmId } = useAppStore();
  const addInventoryItem = useDataStore((s) => s.addInventoryItem);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.quantity) { toast.error('Quantity is required'); return; }
    setSaving(true);
    try {
      addInventoryItem(activeFarmId, {
        name:          form.name.trim(),
        category:      form.category,
        unit:          form.unit,
        quantity:      parseFloat(form.quantity) || 0,
        minStockLevel: form.minStockLevel ? parseFloat(form.minStockLevel) : undefined,
        location:      form.location || undefined,
        supplier:      form.supplier || undefined,
        costPerUnit:   form.costPerUnit ? parseFloat(form.costPerUnit) : undefined,
        expiryDate:    form.expiryDate || undefined,
        notes:         form.notes || undefined,
      });
      toast.success(`"${form.name}" added to inventory`);
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
      title="Add Inventory Item"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Item Name *</label>
          <input className="input" placeholder="e.g. Glyphosate 450" value={form.name}
            onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Current Quantity *</label>
            <input className="input" type="number" min="0" step="0.1" placeholder="0"
              value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </div>
          <div>
            <label className="label">Min Stock Level</label>
            <input className="input" type="number" min="0" step="0.1" placeholder="0 (optional)"
              value={form.minStockLevel} onChange={(e) => set('minStockLevel', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cost per Unit (AUD)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.costPerUnit} onChange={(e) => set('costPerUnit', e.target.value)} />
          </div>
          <div>
            <label className="label">Expiry Date</label>
            <input className="input" type="date" value={form.expiryDate}
              onChange={(e) => set('expiryDate', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Storage Location</label>
            <input className="input" placeholder="e.g. Shed A, Chemical store"
              value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Supplier</label>
            <input className="input" placeholder="e.g. Elders, Nutrien"
              value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
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
