import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { useFarmData } from '../../hooks/useFarmData';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../lib/utils';
import type { Task } from '../../types';
import { CheckSquare, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
  canWrite: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string, title: string) => void;
}

export function TaskDetailModal({ open, onClose, task, canWrite, onEdit, onDelete }: TaskDetailModalProps) {
  const { paddocks, equipment } = useFarmData();
  const updateTaskStatus = useDataStore((s) => s.updateTaskStatus);

  const getPaddockName = (id?: string) => paddocks.find((p) => p.id === id)?.name;
  const getEquipmentName = (id?: string) => equipment.find((e) => e.id === id)?.name;

  const handleToggleDone = () => {
    if (!task) return;
    updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    toast.success(task.status === 'done' ? `"${task.title}" reopened` : `"${task.title}" marked done`);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal open={open} onClose={onClose} title={task.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={task.priority} />
          <StatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
        )}

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Due date</span><span className="font-medium">{formatDate(task.dueDate) || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Assigned to</span><span>{task.assignedTo ?? 'Unassigned'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="capitalize">{task.category || '—'}</span></div>
          {getPaddockName(task.paddockId) && (
            <div className="flex justify-between"><span className="text-gray-500">Paddock</span><span>{getPaddockName(task.paddockId)}</span></div>
          )}
          {getEquipmentName(task.equipmentId) && (
            <div className="flex justify-between"><span className="text-gray-500">Equipment</span><span>{getEquipmentName(task.equipmentId)}</span></div>
          )}
          {task.completedDate && (
            <div className="flex justify-between"><span className="text-gray-500">Completed</span><span>{formatDate(task.completedDate)}</span></div>
          )}
        </div>

        {task.notes && <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{task.notes}</p>}

        {canWrite && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button className="btn-primary text-sm" onClick={handleToggleDone}>
              {task.status === 'done'
                ? <><RotateCcw className="w-4 h-4" /> Reopen</>
                : <><CheckSquare className="w-4 h-4" /> Mark Done</>}
            </button>
            <button className="btn-secondary text-sm" onClick={() => { onEdit(task); onClose(); }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              className="btn-secondary text-sm text-red-600 hover:bg-red-50"
              onClick={() => { onDelete(task.id, task.title); onClose(); }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button className="btn-secondary text-sm ml-auto" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
