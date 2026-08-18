import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { useFarmData } from '../../hooks/useFarmData';
import { useDataStore } from '../../store/dataStore';
import { formatDate, formatCurrency } from '../../lib/utils';
import type { FarmNotification } from '../../hooks/useNotifications';
import { CheckSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationDetailModalProps {
  open: boolean;
  onClose: () => void;
  notification?: FarmNotification;
}

const PAGE_LABEL: Record<FarmNotification['type'], string> = {
  task: 'Tasks', inventory: 'Inventory', equipment: 'Equipment',
};

export function NotificationDetailModal({ open, onClose, notification: n }: NotificationDetailModalProps) {
  const { tasks, inventory, equipment, paddocks } = useFarmData();
  const updateTaskStatus = useDataStore((s) => s.updateTaskStatus);
  const navigate = useNavigate();

  const task = n?.type === 'task' ? tasks.find((t) => t.id === n.recordId) : undefined;
  const item = n?.type === 'inventory' ? inventory.find((i) => i.id === n.recordId) : undefined;
  const machine = n?.type === 'equipment' ? equipment.find((e) => e.id === n.recordId) : undefined;

  const getPaddockName = (id?: string) => paddocks.find((p) => p.id === id)?.name;

  const handleViewFull = () => {
    if (!n) return;
    navigate(n.to);
    onClose();
  };

  const handleMarkDone = () => {
    if (!task) return;
    updateTaskStatus(task.id, 'done');
    toast.success(`"${task.title}" marked done`);
    onClose();
  };

  if (!n) return null;

  return (
    <Modal open={open} onClose={onClose} title={n.message}>
      <div className="space-y-4">
        {task && (
          <div className="space-y-3">
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{task.title}</p>
              {task.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Due date</span><span className="font-medium">{formatDate(task.dueDate)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Assigned to</span><span>{task.assignedTo ?? 'Unassigned'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="capitalize">{task.category}</span></div>
              {getPaddockName(task.paddockId) && (
                <div className="flex justify-between"><span className="text-gray-500">Paddock</span><span>{getPaddockName(task.paddockId)}</span></div>
              )}
            </div>
            {task.notes && <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{task.notes}</p>}
          </div>
        )}

        {item && (
          <div className="space-y-3">
            <p className="font-bold text-gray-900 dark:text-gray-100">{item.name}</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Remaining</span><span className="font-bold text-amber-600">{item.quantity} {item.unit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Minimum level</span><span>{item.minStockLevel} {item.unit}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="capitalize">{item.category}</span></div>
              {item.location && <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{item.location}</span></div>}
              {item.supplier && <div className="flex justify-between"><span className="text-gray-500">Supplier</span><span>{item.supplier}</span></div>}
              {item.costPerUnit && <div className="flex justify-between"><span className="text-gray-500">Cost/unit</span><span>{formatCurrency(item.costPerUnit)}</span></div>}
            </div>
          </div>
        )}

        {machine && (
          <div className="space-y-3">
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{machine.name}</p>
              <p className="text-xs text-gray-400">{machine.year} · {machine.make} {machine.model}</p>
            </div>
            <StatusBadge status={machine.status} />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Last service</span><span>{formatDate(machine.lastServiceDate)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Next service</span><span className="font-medium text-amber-600">{formatDate(machine.nextServiceDate)}</span></div>
              {machine.hoursOrKm != null && <div className="flex justify-between"><span className="text-gray-500">Hours / km</span><span>{machine.hoursOrKm.toLocaleString()}</span></div>}
            </div>
          </div>
        )}

        {!task && !item && !machine && (
          <p className="text-sm text-gray-400">This record may have been updated or removed.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {task && task.status !== 'done' && (
            <button className="btn-primary text-sm" onClick={handleMarkDone}>
              <CheckSquare className="w-4 h-4" /> Mark Done
            </button>
          )}
          <button className="btn-secondary text-sm" onClick={handleViewFull}>
            View in {PAGE_LABEL[n.type]} <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="btn-secondary text-sm ml-auto" onClick={onClose}>Dismiss</button>
        </div>
      </div>
    </Modal>
  );
}
