import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../lib/utils';
import type { LivestockMobGroup } from '../../types';
import toast from 'react-hot-toast';

interface AddMobTreatmentModalProps {
  open: boolean;
  onClose: () => void;
  mob?: LivestockMobGroup;
}

const TREATMENT_TYPES = ['Drench', 'Vaccination', 'Blood test', 'Foot treatment', 'Other'];

export function AddMobTreatmentModal({ open, onClose, mob }: AddMobTreatmentModalProps) {
  const updateLivestockMob = useDataStore((s) => s.updateLivestockMob);
  const [type, setType] = useState('Drench');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (open) { setType('Drench'); setDate(new Date().toISOString().slice(0, 10)); setDetails(''); }
  }, [open]);

  const handleSave = () => {
    if (!mob) return;
    const entry = `${type} on ${formatDate(date)}${details ? ` — ${details}` : ''}`;
    updateLivestockMob(mob.id, {
      notes: mob.notes ? `${mob.notes}\n${entry}` : entry,
    });
    toast.success(`Treatment logged for ${mob.name}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mob ? `Add Treatment — ${mob.name}` : 'Add Treatment'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Treatment</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Treatment type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TREATMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Details</label>
          <textarea className="input resize-none" rows={2} placeholder="Product used, dose rate, who administered it…" value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
