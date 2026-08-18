import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useDataStore } from '../../store/dataStore';
import type { CropRecord } from '../../types';
import toast from 'react-hot-toast';

interface RecordYieldModalProps {
  open: boolean;
  onClose: () => void;
  crop?: CropRecord;
}

export function RecordYieldModal({ open, onClose, crop }: RecordYieldModalProps) {
  const updateCrop = useDataStore((s) => s.updateCrop);
  const [yieldTonnesHa, setYieldTonnesHa] = useState('');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setYieldTonnesHa(crop?.actualYieldTonnesHa?.toString() ?? '');
      setHarvestDate(crop?.actualHarvestDate ?? new Date().toISOString().slice(0, 10));
    }
  }, [open, crop]);

  const handleSave = () => {
    if (!crop) return;
    if (!yieldTonnesHa || Number.isNaN(Number(yieldTonnesHa))) { toast.error('Enter a valid yield'); return; }
    updateCrop(crop.id, {
      actualYieldTonnesHa: Number(yieldTonnesHa),
      actualHarvestDate: harvestDate,
      status: 'harvested',
    });
    toast.success(`Yield recorded for ${crop.cropName}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={crop ? `Record Yield — ${crop.cropName}` : 'Record Yield'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Yield</button>
        </>
      }
    >
      <div className="space-y-4">
        {crop?.expectedYieldTonnesHa && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Target yield was <span className="font-semibold text-farm-700 dark:text-farm-400">{crop.expectedYieldTonnesHa} t/ha</span>.
          </p>
        )}
        <div>
          <label className="label">Actual yield (t/ha) *</label>
          <input className="input" type="number" step="0.01" placeholder="e.g. 4.2" value={yieldTonnesHa} onChange={(e) => setYieldTonnesHa(e.target.value)} />
        </div>
        <div>
          <label className="label">Harvest date</label>
          <input className="input" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
        </div>
        <p className="text-xs text-gray-400">Saving marks this crop record as harvested.</p>
      </div>
    </Modal>
  );
}
