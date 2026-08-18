import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { supabase } from '../../lib/supabase';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  farmId: string;
  onInvited: () => void;
}

const INVITABLE_ROLES: { role: UserRole; blurb: string }[] = [
  { role: 'manager', blurb: 'Full write access to day-to-day operations and finance.' },
  { role: 'operator', blurb: 'Day-to-day fieldwork — paddocks, livestock, tasks. No finance access.' },
  { role: 'agronomist', blurb: 'Plans crops and tasks; read-only elsewhere.' },
  { role: 'accountant', blurb: 'Manages finance; read-only elsewhere.' },
  { role: 'readonly', blurb: 'Can see everything, change nothing.' },
];

export function InviteUserModal({ open, onClose, farmId, onInvited }: InviteUserModalProps) {
  const { demoMode } = useAppStore();
  const [form, setForm] = useState({ name: '', email: '', role: 'operator' as UserRole });
  const [sending, setSending] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm({ name: '', email: '', role: 'operator' });
  }, [open]);

  const handleSend = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (demoMode) { toast.error("Invites aren't sent in demo mode"); onClose(); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { farmId, email: form.email.trim(), name: form.name.trim(), role: form.role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Invite sent to ${form.email.trim()}`);
      onInvited();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Team Member"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSend} disabled={sending}>{sending ? 'Sending…' : 'Send Invite'}</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Their full name" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="them@example.com" />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input capitalize" value={form.role} onChange={(e) => set('role', e.target.value as UserRole)}>
            {INVITABLE_ROLES.map(({ role }) => <option key={role} value={role} className="capitalize">{role}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {INVITABLE_ROLES.find((r) => r.role === form.role)?.blurb}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          They'll get an email to set a password and sign in — no account needed yet.
        </p>
      </div>
    </Modal>
  );
}
