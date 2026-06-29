import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import { useFarmData } from '../../hooks/useFarmData';
import type { Task } from '../../types';
import toast from 'react-hot-toast';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ['crops', 'livestock', 'machinery', 'irrigation', 'finance', 'inventory', 'general'];

export function AddTaskModal({ open, onClose }: AddTaskModalProps) {
  const { activeFarmId } = useAppStore();
  const addTask = useDataStore((s) => s.addTask);
  const { paddocks, users } = useFarmData();
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', category: 'general',
    assignedTo: '', dueDate: '', paddockId: '', notes: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title) { toast.error('Task title is required'); return; }
    addTask(activeFarmId, {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority as Task['priority'],
      category: form.category as Task['category'],
      assignedTo: form.assignedTo || 'Unassigned',
      dueDate: form.dueDate || new Date().toISOString().slice(0, 10),
      paddockId: form.paddockId || undefined,
      notes: form.notes || undefined,
      status: 'todo',
    });
    toast.success(`Task "${form.title}" created!`);
    onClose();
    setForm({ title: '', description: '', priority: 'medium', category: 'general', assignedTo: '', dueDate: '', paddockId: '', notes: '' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Task"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create Task</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Task Title *</label>
          <input className="input" placeholder="e.g. Apply fungicide – North Flat" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} placeholder="Additional details…" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Related Paddock (optional)</label>
            <select className="input" value={form.paddockId} onChange={(e) => set('paddockId', e.target.value)}>
              <option value="">None</option>
              {paddocks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="Any additional notes…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
