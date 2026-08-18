import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useDataStore } from '../../store/dataStore';
import { useFarmData } from '../../hooks/useFarmData';
import { formatDate } from '../../lib/utils';
import type { LivestockMobGroup } from '../../types';
import toast from 'react-hot-toast';

interface RecordMobMovementModalProps {
  open: boolean;
  onClose: () => void;
  mob?: LivestockMobGroup;
}

export function RecordMobMovementModal({ open, onClose, mob }: RecordMobMovementModalProps) {
  const updateLivestockMob = useDataStore((s) => s.updateLivestockMob);
  const { paddocks } = useFarmData();
  const [paddockId, setPaddockId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) { setPaddockId(mob?.paddockId ?? ''); setDate(new Date().toISOString().slice(0, 10)); }
  }, [open, mob]);

  const handleSave = () => {
    if (!mob) return;
    if (!paddockId) { toast.error('Select a destination paddock'); return; }
    const destName = paddocks.find((p) => p.id === paddockId)?.name ?? 'Unknown paddock';
    const fromName = paddocks.find((p) => p.id === mob.paddockId)?.name;
    const entry = `Moved${fromName ? ` from ${fromName}` : ''} to ${destName} on ${formatDate(date)}`;
    updateLivestockMob(mob.id, {
      paddockId,
      notes: mob.notes ? `${mob.notes}\n${entry}` : entry,
    });
    toast.success(`${mob.name} moved to ${destName}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mob ? `Record Movement — ${mob.name}` : 'Record Movement'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Movement</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Move to paddock</label>
          <select className="input" value={paddockId} onChange={(e) => setPaddockId(e.target.value)}>
            <option value="">Select paddock…</option>
            {paddocks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {mob?.paddockId && (
          <p className="text-xs text-gray-400">
            Currently in {paddocks.find((p) => p.id === mob.paddockId)?.name ?? 'an unmapped paddock'}.
          </p>
        )}
      </div>
    </Modal>
  );
}
