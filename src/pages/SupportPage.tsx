import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useFarmData } from '../hooks/useFarmData';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../lib/utils';
import type { SupportTicket, TicketCategory } from '../types';
import toast from 'react-hot-toast';
import { Plus, Send, ArrowLeft, LifeBuoy } from 'lucide-react';

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account & Access' },
  { value: 'bug', label: 'Something\'s Broken' },
  { value: 'question', label: 'How Do I…?' },
];

export function SupportPage() {
  const { farm, supportTickets, ticketMessages, users } = useFarmData();
  const addSupportTicket = useDataStore((s) => s.addSupportTicket);
  const addTicketMessage = useDataStore((s) => s.addTicketMessage);
  const updateTicketStatus = useDataStore((s) => s.updateTicketStatus);
  const { demoMode } = useAppStore();
  const { user } = useAuthStore();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<SupportTicket | undefined>();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');

  const myProfile = demoMode ? users[0] : users.find((u) => u.userId === user?.id);
  const displayName = myProfile?.name || (user?.user_metadata?.name as string | undefined) || user?.email || 'Me';
  const displayEmail = demoMode ? 'demo@farmmap.app' : (user?.email ?? '');

  const sorted = [...supportTickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const threadMessages = selected ? ticketMessages.filter((m) => m.ticketId === selected.id) : [];

  const handleCreate = () => {
    if (!subject.trim() || !body.trim()) { toast.error('Subject and message are required'); return; }
    if (demoMode) { toast.error("Tickets aren't saved in demo mode"); setShowNew(false); return; }
    const ticket = addSupportTicket(farm!.id, { subject: subject.trim(), category, priority: 'normal', createdByName: displayName, createdByEmail: displayEmail });
    addTicketMessage({ ticketId: ticket.id, authorType: 'customer', authorName: displayName, authorEmail: displayEmail, message: body.trim() });
    setSubject(''); setBody(''); setCategory('general'); setShowNew(false);
    toast.success('Ticket submitted — FarmMap Support will reply here');
  };

  const handleReply = () => {
    if (!selected || !reply.trim()) return;
    addTicketMessage({ ticketId: selected.id, authorType: 'customer', authorName: displayName, authorEmail: displayEmail, message: reply.trim() });
    setReply('');
  };

  const handleMarkResolved = () => {
    if (!selected) return;
    updateTicketStatus(selected.id, 'resolved');
    setSelected({ ...selected, status: 'resolved' });
    toast.success('Marked resolved');
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(undefined)} className="btn-secondary text-sm"><ArrowLeft className="w-4 h-4" /> Back to tickets</button>
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selected.subject}</h2>
              <p className="text-xs text-gray-400 capitalize">{selected.category.replace('_', ' ')} · opened {formatDate(selected.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selected.status} />
              {selected.status !== 'resolved' && selected.status !== 'closed' && (
                <button className="btn-secondary text-xs py-1 px-2" onClick={handleMarkResolved}>Mark Resolved</button>
              )}
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          {threadMessages.map((m) => (
            <div key={m.id} className={`flex ${m.authorType === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.authorType === 'customer' ? 'bg-farm-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'}`}>
                <p className="text-[10px] opacity-70 mb-0.5">{m.authorType === 'staff' ? 'FarmMap Support' : m.authorName} · {formatDate(m.createdAt)}</p>
                {m.message}
              </div>
            </div>
          ))}
          {threadMessages.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>}
        </div>

        {selected.status !== 'closed' && (
          <div className="card flex gap-2">
            <input
              className="input flex-1"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
              placeholder="Reply…"
            />
            <button className="btn-primary" disabled={!reply.trim()} onClick={handleReply}><Send className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Support Ticket"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate}>Submit</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Subject *</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea className="input" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe the issue or question…" />
          </div>
        </div>
      </Modal>

      <PageHeader
        title="Support"
        subtitle="Questions or issues with FarmMap — we usually reply within a business day"
        actions={
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        }
      />

      <div className="space-y-3">
        {sorted.map((t) => (
          <button key={t.id} onClick={() => setSelected(t)} className="card w-full text-left flex items-center justify-between hover:border-farm-300 dark:hover:border-farm-700 transition-colors">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{t.subject}</p>
              <p className="text-xs text-gray-400 capitalize">{t.category.replace('_', ' ')} · updated {formatDate(t.updatedAt)}</p>
            </div>
            <StatusBadge status={t.status} />
          </button>
        ))}
        {sorted.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-farm-200" />
            <p className="text-sm font-medium">No support tickets yet</p>
            <p className="text-xs mt-1">Got a question or found a bug? Submit a ticket above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
