import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { dbToJs, mapRows } from '../../lib/db';
import { formatDate, getInitials } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchBar } from '../../components/ui/SearchBar';
import type { Farm, User, SupportTicket, TicketMessage, UserRole } from '../../types';
import toast from 'react-hot-toast';
import {
  Wheat, Loader2, Search, Users, Ticket as TicketIcon, ShieldCheck, Send,
  RefreshCw, AlertTriangle, ArrowLeft, LogOut, Plus,
} from 'lucide-react';

type Tab = 'accounts' | 'tickets' | 'staff';
const ASSIGNABLE_ROLES: UserRole[] = ['manager', 'operator', 'agronomist', 'accountant', 'readonly'];

interface FarmSearchResult { farmId: string; farmName: string; owner: string; region: string; matchedVia: string; }
interface ClientErrorRow { id: number; message: string; stack?: string; path?: string; userEmail?: string; createdAt: string; }
interface PlatformStaffRow { email: string; tier: string; isAdmin: boolean; active: boolean; addedBy?: string; createdAt: string; }
interface TicketRow extends SupportTicket { farmName?: string; farmOwner?: string; }

async function callStaffPortal<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('staff-portal', { body: { action, ...params } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function StaffPortalPage() {
  const { signOut } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('accounts');

  useEffect(() => {
    callStaffPortal<{ isStaff: boolean; isAdmin: boolean }>('whoami')
      .then((res) => { setIsStaff(res.isStaff); setIsAdmin(res.isAdmin); })
      .catch(() => setIsStaff(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-6 h-6 text-farm-600 animate-spin" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950 px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="font-semibold text-gray-900 dark:text-gray-100">Not authorized</p>
        <a href="/" className="text-sm text-farm-700 dark:text-farm-300 underline">Back to FarmMap</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-farm-900 text-white px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-farm-500 flex items-center justify-center">
            <Wheat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold">FarmMap Staff Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-farm-200 hover:text-white inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> My Farm
          </a>
          <button onClick={() => signOut()} className="text-sm text-farm-200 hover:text-white inline-flex items-center gap-1.5">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6">
          <TabButton active={tab === 'accounts'} onClick={() => setTab('accounts')} icon={<Users className="w-4 h-4" />} label="Accounts" />
          <TabButton active={tab === 'tickets'} onClick={() => setTab('tickets')} icon={<TicketIcon className="w-4 h-4" />} label="Tickets" />
          {isAdmin && <TabButton active={tab === 'staff'} onClick={() => setTab('staff')} icon={<ShieldCheck className="w-4 h-4" />} label="Staff" />}
        </div>

        {tab === 'accounts' && <AccountsTab />}
        {tab === 'tickets' && <TicketsTab />}
        {tab === 'staff' && isAdmin && <StaffTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors ${
        active ? 'bg-farm-700 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-farm-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// ── Accounts tab ─────────────────────────────────────────────────────────────

function AccountsTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FarmSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>();

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await callStaffPortal<{ results: FarmSearchResult[] }>('search_farms', { query: q });
      setResults(res.results);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  if (selectedFarmId) {
    return <FarmDetail farmId={selectedFarmId} onBack={() => setSelectedFarmId(undefined)} />;
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by farm name, owner, or team member email…" />
      </div>
      {searching && <p className="text-sm text-gray-400">Searching…</p>}
      <div className="space-y-2">
        {results.map((r) => (
          <button
            key={r.farmId}
            onClick={() => setSelectedFarmId(r.farmId)}
            className="card w-full text-left flex items-center justify-between hover:border-farm-300 dark:hover:border-farm-700 transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{r.farmName}</p>
              <p className="text-xs text-gray-400">{r.owner} · {r.region} · matched via {r.matchedVia}</p>
            </div>
            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </button>
        ))}
        {!searching && query.trim() && results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No matches for "{query}"</p>
        )}
      </div>
    </div>
  );
}

function FarmDetail({ farmId, onBack }: { farmId: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState<Farm | undefined>();
  const [roster, setRoster] = useState<User[]>([]);
  const [counts, setCounts] = useState<{ paddocks: number; livestockMobs: number; tasks: number }>({ paddocks: 0, livestockMobs: 0, tasks: 0 });
  const [errors, setErrors] = useState<ClientErrorRow[]>([]);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, errorsRes] = await Promise.all([
        callStaffPortal<{ farm: Record<string, unknown>; roster: Record<string, unknown>[]; counts: typeof counts }>('get_farm_detail', { farmId }),
        callStaffPortal<{ errors: Record<string, unknown>[] }>('get_client_errors', { farmId }),
      ]);
      setFarm(dbToJs<Farm>(detail.farm));
      setRoster(mapRows<User>(detail.roster));
      setCounts(detail.counts);
      setErrors(mapRows<ClientErrorRow>(errorsRes.errors));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load farm');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  useEffect(() => { load(); }, [load]);

  const handleResendInvite = async (u: User) => {
    setBusyRowId(u.id);
    try {
      await callStaffPortal('resend_invite', { farmUserId: u.id });
      toast.success(`Invite resent to ${u.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setBusyRowId(null);
    }
  };

  const handleToggleActive = async (u: User) => {
    setBusyRowId(u.id);
    try {
      await callStaffPortal('toggle_user_active', { farmUserId: u.id, active: !u.active });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setBusyRowId(null);
    }
  };

  const handleRoleChange = async (u: User, role: UserRole) => {
    setBusyRowId(u.id);
    try {
      await callStaffPortal('change_user_role', { farmUserId: u.id, role });
      await load();
      toast.success(`${u.name}'s role updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setBusyRowId(null);
    }
  };

  if (loading) return <div className="card"><Loader2 className="w-5 h-5 animate-spin text-farm-600 mx-auto" /></div>;
  if (!farm) return <div className="card">Farm not found.</div>;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="btn-secondary text-sm"><ArrowLeft className="w-4 h-4" /> Back to search</button>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{farm.name}</h2>
        <p className="text-sm text-gray-400">{farm.owner} · {farm.region}, {farm.state} · {farm.totalHectares} ha</p>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>{counts.paddocks} paddocks</span>
          <span>{counts.livestockMobs} mobs</span>
          <span>{counts.tasks} tasks</span>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-3">Team</h3>
        <div className="space-y-2">
          {roster.map((u) => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-farm-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{getInitials(u.name)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email} · last login {formatDate(u.lastLogin) || 'never'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {!u.userId && <StatusBadge status="pending" label="Pending" />}
                <StatusBadge status={u.active ? 'active' : 'locked'} label={u.active ? 'Active' : 'Inactive'} />
                {u.role !== 'owner' && (
                  <select
                    className="input text-xs py-1 w-28 capitalize"
                    value={u.role}
                    disabled={busyRowId === u.id}
                    onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                  >
                    {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
                {!u.userId && (
                  <button className="btn-secondary text-xs py-1 px-2" disabled={busyRowId === u.id} onClick={() => handleResendInvite(u)}>
                    <Send className="w-3 h-3" /> Resend
                  </button>
                )}
                {u.role !== 'owner' && (
                  <button className="btn-secondary text-xs py-1 px-2" disabled={busyRowId === u.id} onClick={() => handleToggleActive(u)}>
                    {u.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-3">Recent Errors</h3>
        {errors.length === 0 ? (
          <p className="text-sm text-gray-400">No client errors logged for this farm.</p>
        ) : (
          <div className="space-y-2">
            {errors.map((e) => (
              <div key={e.id} className="text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <p className="font-mono text-red-600 dark:text-red-400">{e.message}</p>
                <p className="text-gray-400 mt-0.5">{e.path} · {e.userEmail} · {formatDate(e.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tickets tab ───────────────────────────────────────────────────────────────

function TicketsTab() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callStaffPortal<{ tickets: Record<string, unknown>[] }>('list_tickets', {
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setTickets(mapRows<TicketRow>(res.tickets));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  if (selected) return <TicketThread ticketId={selected} onBack={() => { setSelected(undefined); load(); }} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusFilter === s ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-farm-600 mx-auto" />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)} className="card w-full text-left flex items-center justify-between hover:border-farm-300 dark:hover:border-farm-700 transition-colors">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{t.subject}</p>
                <p className="text-xs text-gray-400">{t.farmName} ({t.farmOwner}) · {t.createdByEmail}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={t.status} />
                {t.assignedStaffEmail && <span className="text-[10px] text-gray-400">→ {t.assignedStaffEmail}</span>}
              </div>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No tickets.</p>}
        </div>
      )}
    </div>
  );
}

function TicketThread({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketRow | undefined>();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [farm, setFarm] = useState<{ name?: string; owner?: string } | undefined>();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callStaffPortal<{ ticket: Record<string, unknown>; messages: Record<string, unknown>[]; farm: { name?: string; owner?: string } }>('get_ticket', { ticketId });
      setTicket(dbToJs<TicketRow>(res.ticket));
      setMessages(mapRows<TicketMessage>(res.messages));
      setFarm(res.farm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await callStaffPortal('reply_ticket', { ticketId, message: reply.trim() });
      setReply('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await callStaffPortal('update_ticket_status', { ticketId, status });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleAssignToMe = async () => {
    try {
      await callStaffPortal('assign_ticket', { ticketId });
      await load();
      toast.success('Assigned to you');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign');
    }
  };

  if (loading) return <div className="card"><Loader2 className="w-5 h-5 animate-spin text-farm-600 mx-auto" /></div>;
  if (!ticket) return <div className="card">Ticket not found.</div>;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="btn-secondary text-sm"><ArrowLeft className="w-4 h-4" /> Back to queue</button>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{ticket.subject}</h2>
            <p className="text-xs text-gray-400">{farm?.name} ({farm?.owner}) · {ticket.createdByName} &lt;{ticket.createdByEmail}&gt;</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="input text-xs py-1" value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)}>
              {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button className="btn-secondary text-xs py-1 px-2" onClick={handleAssignToMe}>
              <RefreshCw className="w-3 h-3" /> Assign to me
            </button>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.authorType === 'staff' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.authorType === 'staff' ? 'bg-farm-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'}`}>
              <p className="text-[10px] opacity-70 mb-0.5">{m.authorType === 'staff' ? 'FarmMap Support' : m.authorName} · {formatDate(m.createdAt)}</p>
              {m.message}
            </div>
          </div>
        ))}
      </div>

      <div className="card flex gap-2">
        <input
          className="input flex-1"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
          placeholder="Reply as FarmMap Support…"
        />
        <button className="btn-primary" disabled={sending || !reply.trim()} onClick={handleReply}><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ── Staff tab (admin-only) ──────────────────────────────────────────────────

function StaffTab() {
  const [staff, setStaff] = useState<PlatformStaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callStaffPortal<{ staff: Record<string, unknown>[] }>('list_staff');
      setStaff(mapRows<PlatformStaffRow>(res.staff));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      await callStaffPortal('add_external_staff', { email: newEmail.trim(), name: newName.trim() || undefined });
      toast.success(`${newEmail} added as external staff`);
      setNewEmail(''); setNewName('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add staff');
    } finally {
      setAdding(false);
    }
  };

  const handleDeactivate = async (email: string) => {
    if (!window.confirm(`Deactivate ${email}?`)) return;
    try {
      await callStaffPortal('deactivate_staff', { email });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="section-title mb-3">Add External Staff</h3>
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1 min-w-[200px]" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <input className="input flex-1 min-w-[160px]" placeholder="Name (optional)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn-primary" disabled={adding || !newEmail.trim()} onClick={handleAdd}><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-3">Staff Roster</h3>
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-farm-600 mx-auto" /> : (
          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.email} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.tier}{s.isAdmin ? ' · Administrator' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.active ? 'active' : 'locked'} label={s.active ? 'Active' : 'Inactive'} />
                  {s.active && (
                    <button className="btn-secondary text-xs py-1 px-2" onClick={() => handleDeactivate(s.email)}>Deactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
