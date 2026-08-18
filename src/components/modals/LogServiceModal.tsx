import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useDataStore } from '../../store/dataStore';
import type { Equipment, MaintenanceLog } from '../../types';
import toast from 'react-hot-toast';

interface LogServiceModalProps {
  open: boolean;
  onClose: () => void;
  equipment?: Equipment;
}

const TYPES: MaintenanceLog['type'][] = ['service', 'repair', 'inspection'];

export function LogServiceModal({ open, onClose, equipment }: LogServiceModalProps) {
  const addMaintenanceLog = useDataStore((s) => s.addMaintenanceLog);
  const updateEquipment = useDataStore((s) => s.updateEquipment);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10), type: 'service' as MaintenanceLog['type'],
    description: '', costAUD: '', technician: '', nextDueDate: '',
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm({ date: new Date().toISOString().slice(0, 10), type: 'service', description: '', costAUD: '', technician: '', nextDueDate: '' });
    }
  }, [open]);

  const handleSave = () => {
    if (!equipment) return;
    if (!form.description.trim()) { toast.error('Enter a short description'); return; }
    addMaintenanceLog({
      equipmentId: equipment.id,
      date: form.date,
      type: form.type,
      description: form.description,
      costAUD: form.costAUD ? Number(form.costAUD) : undefined,
      technician: form.technician || undefined,
      nextDueDate: form.nextDueDate || undefined,
    });
    updateEquipment(equipment.id, {
      lastServiceDate: form.date,
      nextServiceDate: form.nextDueDate || equipment.nextServiceDate,
      status: equipment.status === 'repair' || equipment.status === 'maintenance' ? 'operational' : equipment.status,
    });
    toast.success(`Service logged for ${equipment.name}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={equipment ? `Log Service — ${equipment.name}` : 'Log Service'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Log</button>
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
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value as MaintenanceLog['type'])}>
              {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description *</label>
          <textarea className="input resize-none" rows={2} placeholder="e.g. Oil and filter change, brake inspection" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cost (AUD)</label>
            <input className="input" type="number" step="0.01" placeholder="e.g. 450" value={form.costAUD} onChange={(e) => set('costAUD', e.target.value)} />
          </div>
          <div>
            <label className="label">Technician</label>
            <input className="input" placeholder="Who did the work" value={form.technician} onChange={(e) => set('technician', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Next service due (optional)</label>
            <input className="input" type="date" value={form.nextDueDate} onChange={(e) => set('nextDueDate', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
