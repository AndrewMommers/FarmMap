import { Modal } from '../ui/Modal';
import { useFarmData } from '../../hooks/useFarmData';
import { formatDate } from '../../lib/utils';
import type { Paddock } from '../../types';
import { Droplets, Sprout } from 'lucide-react';

interface PaddockLogModalProps {
  open: boolean;
  onClose: () => void;
  paddock?: Paddock;
}

export function PaddockLogModal({ open, onClose, paddock }: PaddockLogModalProps) {
  const { sprayRecords, crops } = useFarmData();

  const paddockSprays = sprayRecords
    .filter((s) => s.paddockId === paddock?.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const paddockCrops = crops
    .filter((c) => c.paddockId === paddock?.id)
    .sort((a, b) => (b.plantingDate ?? '').localeCompare(a.plantingDate ?? ''));

  return (
    <Modal open={open} onClose={onClose} title={paddock ? `Activity Log — ${paddock.name}` : 'Activity Log'} size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5" /> Crop history ({paddockCrops.length})
          </h3>
          {paddockCrops.length === 0 ? (
            <p className="text-sm text-gray-400">No crop records for this paddock yet.</p>
          ) : (
            <div className="space-y-2">
              {paddockCrops.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-gray-800 pb-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{c.cropName}{c.variety ? ` — ${c.variety}` : ''}</p>
                    <p className="text-xs text-gray-400">{c.season} · planted {formatDate(c.plantingDate)}</p>
                  </div>
                  <span className="text-xs font-semibold text-farm-600 capitalize">{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5" /> Spray history ({paddockSprays.length})
          </h3>
          {paddockSprays.length === 0 ? (
            <p className="text-sm text-gray-400">No spray records for this paddock yet.</p>
          ) : (
            <div className="space-y-2">
              {paddockSprays.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b border-gray-50 dark:border-gray-800 pb-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{s.product}</p>
                    <p className="text-xs text-gray-400">{formatDate(s.date)} · {s.ratePerHa} {s.unit} · {s.operator}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600">
                    {s.withholdingDays ? `${s.withholdingDays}d WHP` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
