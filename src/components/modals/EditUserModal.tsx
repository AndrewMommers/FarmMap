import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useDataStore } from '../../store/dataStore';
import { useAppStore } from '../../store/appStore';
import type { User, UserRole } from '../../types';
import toast from 'react-hot-toast';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user?: User;
}

const ROLES: UserRole[] = ['owner', 'manager', 'operator', 'agronomist', 'accountant', 'readonly'];

export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const updateUser = useDataStore((s) => s.updateUser);
  const { demoMode } = useAppStore();
  const [form, setForm] = useState({ name: '', phone: '', role: 'operator' as UserRole, active: true });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open && user) {
      setForm({ name: user.name, phone: user.phone ?? '', role: user.role, active: user.active });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (demoMode) { toast.error("Team member changes aren't saved in demo mode"); onClose(); return; }
    setSaving(true);
    try {
      await updateUser(user.id, { name: form.name, phone: form.phone || undefined, role: form.role, active: form.active });
      toast.success(`${form.name}'s details updated`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update team member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? `Edit — ${user.name}` : 'Edit Team Member'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-gray-50 dark:bg-gray-800 text-gray-400" value={user?.email ?? ''} disabled />
          <p className="text-xs text-gray-400 mt-1">Email can't be changed here — it's tied to their sign-in account.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="04xx xxx xxx" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input capitalize" value={form.role} onChange={(e) => set('role', e.target.value as UserRole)}>
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-farm-700 rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Active team member</span>
        </label>
      </div>
    </Modal>
  );
}
