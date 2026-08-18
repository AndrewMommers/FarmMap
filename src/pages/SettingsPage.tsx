import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useFarmData } from '../hooks/useFarmData';
import { useIntegrations } from '../hooks/useIntegrations';
import { useDevices } from '../hooks/useDevices';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatDate, getInitials, timeAgo } from '../lib/utils';
import { findContainingPaddock, formatCoords } from '../lib/geo';
import { downloadJSON, parseCSV } from '../lib/export';
import toast from 'react-hot-toast';
import {
  Plus, Settings, Users, Bell, Globe, Database, Shield, Tractor, RefreshCw, Unplug,
  Landmark, Zap, CircleUser, Smartphone, RotateCcw, Trash2, MapPin, LogIn, LogOut as LogOutIcon,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { EditUserModal } from '../components/modals/EditUserModal';
import type { FarmType, State, User, TransactionCategory, TransactionType } from '../types';

const TABS = [
  { id: 'general',      label: 'General',        icon: <Settings className="w-4 h-4" /> },
  { id: 'profile',      label: 'My Profile',      icon: <CircleUser className="w-4 h-4" /> },
  { id: 'users',        label: 'Users & Access',  icon: <Users className="w-4 h-4" /> },
  { id: 'alerts',       label: 'Notifications',   icon: <Bell className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations',    icon: <Globe className="w-4 h-4" /> },
  { id: 'devices',      label: 'Devices',         icon: <Smartphone className="w-4 h-4" /> },
  { id: 'data',         label: 'Data & Backup',   icon: <Database className="w-4 h-4" /> },
  { id: 'security',     label: 'Security',        icon: <Shield className="w-4 h-4" /> },
];

const FARM_TYPES: FarmType[] = ['mixed', 'livestock', 'cropping', 'dairy', 'horticulture', 'vineyard', 'poultry', 'aquaculture', 'sugar', 'cotton'];
const STATES: State[] = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const AVATAR_EMOJIS = ['🧑‍🌾', '👩‍🌾', '🧑‍💼', '👨‍🔧', '👩‍🔧', '🚜', '🐑', '🐄', '🌾', '😀', '😎', '🤠'];

export function SettingsPage() {
  const farmData = useFarmData();
  const { users, farm, paddocks, geofenceEvents } = farmData;
  const updateFarm = useDataStore((s) => s.updateFarm);
  const updateUser = useDataStore((s) => s.updateUser);
  const addTransaction = useDataStore((s) => s.addTransaction);
  const { activeFarmId, demoMode } = useAppStore();
  const { user: authUser } = useAuthStore();
  const [tab, setTab] = useState('general');
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [importing, setImporting] = useState(false);

  // ── Deep-link to a specific tab, e.g. the Header profile menu's
  // "My Profile" link going to /settings?tab=profile ─────────────────────────
  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && TABS.some((t) => t.id === requestedTab)) {
      setTab(requestedTab);
      setSearchParams((p) => { p.delete('tab'); return p; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── OAuth redirect landing (John Deere, Xero) ─────────────────────────────
  // The *-oauth-callback Edge Functions send the browser back here with these params.
  const INTEGRATION_LABELS: Record<string, string> = { john_deere: 'John Deere', xero: 'Xero' };
  useEffect(() => {
    const integration = searchParams.get('integration');
    const status = searchParams.get('status');
    if (integration && integration in INTEGRATION_LABELS) {
      setTab('integrations');
      const label = INTEGRATION_LABELS[integration];
      if (status === 'connected') toast.success(`${label} connected!`);
      else if (status === 'error') toast.error(searchParams.get('message') ?? `${label} connection failed`);
      setSearchParams((p) => { p.delete('integration'); p.delete('status'); p.delete('message'); return p; }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Equipment/finance integrations ────────────────────────────────────────
  const {
    johnDeere, loading: integrationsLoading, connectJohnDeere, syncJohnDeere, disconnectJohnDeere,
    xero, connectXero, syncXero, disconnectXero,
    zepto, connectZepto, syncZepto, disconnectZepto,
  } = useIntegrations();
  const [jdBusy, setJdBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  const [xeroBusy, setXeroBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  const [zeptoBusy, setZeptoBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  const [showZeptoForm, setShowZeptoForm] = useState(false);
  const [zeptoApiKey, setZeptoApiKey] = useState('');

  const handleConnectJohnDeere = async () => {
    setJdBusy('connect');
    try { await connectJohnDeere(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not connect to John Deere'); setJdBusy(null); }
  };
  const handleSyncJohnDeere = async () => {
    setJdBusy('sync');
    try {
      const res = await syncJohnDeere();
      toast.success(`Synced ${res.machinesSynced ?? 0} machine${res.machinesSynced === 1 ? '' : 's'} and ${res.boundariesSynced ?? 0} field boundar${res.boundariesSynced === 1 ? 'y' : 'ies'}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Sync failed'); }
    finally { setJdBusy(null); }
  };
  const handleDisconnectJohnDeere = async () => {
    if (!window.confirm('Disconnect John Deere? Equipment already synced will stay in FarmMap, but stop updating.')) return;
    setJdBusy('disconnect');
    try { await disconnectJohnDeere(); toast.success('John Deere disconnected'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Disconnect failed'); }
    finally { setJdBusy(null); }
  };

  const handleConnectXero = async () => {
    setXeroBusy('connect');
    try { await connectXero(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not connect to Xero'); setXeroBusy(null); }
  };
  const handleSyncXero = async () => {
    setXeroBusy('sync');
    try {
      const res = await syncXero();
      toast.success(`Synced ${res.transactionsSynced ?? 0} transaction${res.transactionsSynced === 1 ? '' : 's'} from Xero`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Sync failed'); }
    finally { setXeroBusy(null); }
  };
  const handleDisconnectXero = async () => {
    if (!window.confirm('Disconnect Xero? Transactions already synced will stay in FarmMap, but stop updating.')) return;
    setXeroBusy('disconnect');
    try { await disconnectXero(); toast.success('Xero disconnected'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Disconnect failed'); }
    finally { setXeroBusy(null); }
  };

  const handleConnectZepto = async () => {
    if (!zeptoApiKey.trim()) { toast.error('Enter your Zepto API key'); return; }
    setZeptoBusy('connect');
    try {
      const res = await connectZepto(zeptoApiKey.trim());
      toast.success(`Zepto connected${res.merchantName ? ` as ${res.merchantName}` : ''}!`);
      setShowZeptoForm(false);
      setZeptoApiKey('');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not connect to Zepto'); }
    finally { setZeptoBusy(null); }
  };
  const handleSyncZepto = async () => {
    setZeptoBusy('sync');
    try {
      const res = await syncZepto();
      toast.success(`Synced ${res.transactionsSynced ?? 0} payment${res.transactionsSynced === 1 ? '' : 's'} from Zepto`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Sync failed'); }
    finally { setZeptoBusy(null); }
  };
  const handleDisconnectZepto = async () => {
    if (!window.confirm('Disconnect Zepto? Payments already synced will stay in FarmMap, but stop updating.')) return;
    setZeptoBusy('disconnect');
    try { await disconnectZepto(); toast.success('Zepto disconnected'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Disconnect failed'); }
    finally { setZeptoBusy(null); }
  };

  // ── My Profile ─────────────────────────────────────────────────────────────
  const myProfile = demoMode ? users[0] : users.find((u) => u.userId === authUser?.id);
  const [profileForm, setProfileForm] = useState({
    name: myProfile?.name ?? (authUser?.user_metadata?.name as string | undefined) ?? '',
    phone: myProfile?.phone ?? '',
    avatar: myProfile?.avatar ?? '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const setProfileField = (k: keyof typeof profileForm, v: string) => setProfileForm((f) => ({ ...f, [k]: v }));

  // Sync the form once the auto-provisioned profile row actually arrives.
  useEffect(() => {
    if (myProfile) setProfileForm({ name: myProfile.name, phone: myProfile.phone ?? '', avatar: myProfile.avatar ?? '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.id]);

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setProfileSaving(true);
    try {
      if (myProfile) {
        await updateUser(myProfile.id, {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim() || undefined,
          avatar: profileForm.avatar || undefined,
        });
      }
      const { error } = await supabase.auth.updateUser({ data: { name: profileForm.name.trim() } });
      if (error) throw error;
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Devices (Tractor Mode) ────────────────────────────────────────────────
  const {
    devices, paired, thisDevice,
    registerThisDevice, forgetThisDevice, assignDevice, revokeDevice, reactivateDevice, removeDevice,
  } = useDevices();
  const [showRegisterDevice, setShowRegisterDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceAssignee, setDeviceAssignee] = useState('');
  const [deviceSaving, setDeviceSaving] = useState(false);

  const handleRegisterDevice = async () => {
    if (!deviceName.trim()) { toast.error('Give this device a name'); return; }
    setDeviceSaving(true);
    try {
      await registerThisDevice(deviceName.trim(), deviceAssignee || undefined);
      toast.success(`Registered "${deviceName.trim()}" — this browser will launch straight into Tractor Mode from now on.`);
      setShowRegisterDevice(false);
      setDeviceName('');
      setDeviceAssignee('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not register this device');
    } finally {
      setDeviceSaving(false);
    }
  };
  const handleForgetDevice = () => {
    forgetThisDevice();
    toast.success('This browser is no longer registered as a device.');
  };
  const handleRevokeDevice = async (id: string, name: string) => {
    if (!window.confirm(`Revoke "${name}"? It will be signed out next time it checks in.`)) return;
    try { await revokeDevice(id); toast.success(`"${name}" revoked`); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to revoke device'); }
  };
  const handleDeleteDevice = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from the device list? This cannot be undone.`)) return;
    try { await removeDevice(id); toast.success(`"${name}" removed`); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to remove device'); }
  };

  // ── General / Farm details ────────────────────────────────────────────────
  const [farmForm, setFarmForm] = useState({
    name:          farm.name,
    owner:         farm.owner,
    abn:           farm.abn,
    type:          farm.type as FarmType,
    state:         farm.state as State,
    region:        farm.region,
    totalHectares: String(farm.totalHectares),
    address:       farm.address,
  });
  const [farmSaving, setFarmSaving] = useState(false);
  const setF = (k: string, v: string) => setFarmForm((f) => ({ ...f, [k]: v }));

  const handleSaveFarm = async () => {
    if (!farmForm.name.trim()) { toast.error('Farm name is required'); return; }
    setFarmSaving(true);
    try {
      await updateFarm(activeFarmId, {
        name:          farmForm.name.trim(),
        owner:         farmForm.owner,
        abn:           farmForm.abn,
        type:          farmForm.type,
        state:         farmForm.state,
        region:        farmForm.region,
        totalHectares: parseFloat(farmForm.totalHectares) || 0,
        address:       farmForm.address,
      });
      toast.success('Farm details saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setFarmSaving(false);
    }
  };

  // ── Security / Password change ────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ newPw: '', confirmPw: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const setPw = (k: string, v: string) => setPwForm((f) => ({ ...f, [k]: v }));

  const handleChangePassword = async () => {
    if (pwForm.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (pwForm.newPw !== pwForm.confirmPw) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully!');
    setPwForm({ newPw: '', confirmPw: '' });
  };

  // ── Data export / import ──────────────────────────────────────────────────
  const importFileRef = useRef<HTMLInputElement>(null);
  const VALID_CATEGORIES = new Set<TransactionCategory>([
    'livestock_sale', 'crop_sale', 'produce_sale', 'agistment', 'government_payment',
    'fuel', 'fertiliser', 'chemical', 'seed', 'feed', 'veterinary',
    'labour', 'machinery', 'repairs', 'insurance', 'rates', 'utilities',
    'freight', 'professional_fees', 'other_income', 'other_expense',
  ]);

  const exportAllData = () => {
    downloadJSON(`farmmap-export-${farm?.name ?? 'farm'}-${new Date().toISOString().slice(0, 10)}`, {
      exportedAt: new Date().toISOString(),
      farm,
      paddocks: farmData.paddocks,
      livestockMobs: farmData.livestockMobs,
      livestock: farmData.livestock,
      crops: farmData.crops,
      sprayRecords: farmData.sprayRecords,
      equipment: farmData.equipment,
      maintenanceLogs: farmData.maintenanceLogs,
      transactions: farmData.transactions,
      budgets: farmData.budgets,
      inventory: farmData.inventory,
      tasks: farmData.tasks,
      users: farmData.users,
    });
    toast.success('Farm data exported as JSON');
  };

  // Imports transactions from a CSV matching the Reports page's own export
  // shape (Date, Description, Category, Type, Amount) — the two are
  // deliberately symmetric so a prior export can be re-imported.
  const handleImportCSV = async (file: File) => {
    if (demoMode) { toast.error("Data import isn't available in demo mode"); return; }
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error('CSV has no data rows'); return; }

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = {
        date: header.indexOf('date'),
        description: header.indexOf('description'),
        category: header.indexOf('category'),
        type: header.indexOf('type'),
        amount: header.indexOf('amount'),
      };
      if (idx.date < 0 || idx.description < 0 || idx.type < 0 || idx.amount < 0) {
        toast.error('CSV must have Date, Description, Type and Amount columns');
        return;
      }

      let imported = 0;
      let skipped = 0;
      for (const row of rows.slice(1)) {
        const dateStr = row[idx.date]?.trim();
        const amountStr = row[idx.amount]?.trim();
        const typeStr = row[idx.type]?.trim().toLowerCase();
        const amount = Number(amountStr);
        if (!dateStr || Number.isNaN(Date.parse(dateStr)) || Number.isNaN(amount) || (typeStr !== 'income' && typeStr !== 'expense')) {
          skipped++;
          continue;
        }
        const type = typeStr as TransactionType;
        const rawCategory = (row[idx.category]?.trim().toLowerCase().replace(/\s+/g, '_') ?? '') as TransactionCategory;
        const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : (type === 'income' ? 'other_income' : 'other_expense');

        addTransaction(activeFarmId, {
          date: new Date(dateStr).toISOString().slice(0, 10),
          description: row[idx.description]?.trim() || 'Imported transaction',
          category,
          type,
          amountAUD: Math.abs(amount),
          gstIncluded: false,
        });
        imported++;
      }

      if (imported === 0) toast.error('No valid rows found to import');
      else toast.success(`Imported ${imported} transaction${imported === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}`);
    } catch {
      toast.error('Could not read that file — make sure it\'s a CSV export from FarmMap');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <EditUserModal open={!!editingUser} onClose={() => setEditingUser(undefined)} user={editingUser} />
      <PageHeader title="Settings" subtitle="Farm configuration, users, integrations, and data management" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === t.id ? 'bg-farm-700 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-farm-50 dark:hover:bg-gray-800 hover:text-farm-800 dark:hover:text-farm-300'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'general' && (
            <div className="card space-y-6">
              <h2 className="section-title">Farm Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Farm Name</label>
                  <input className="input" value={farmForm.name} onChange={(e) => setF('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Owner</label>
                  <input className="input" value={farmForm.owner} onChange={(e) => setF('owner', e.target.value)} />
                </div>
                <div>
                  <label className="label">ABN</label>
                  <input className="input" value={farmForm.abn} onChange={(e) => setF('abn', e.target.value)} />
                </div>
                <div>
                  <label className="label">Farm Type</label>
                  <select className="input" value={farmForm.type} onChange={(e) => setF('type', e.target.value)}>
                    {FARM_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">State</label>
                  <select className="input" value={farmForm.state} onChange={(e) => setF('state', e.target.value)}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Region</label>
                  <input className="input" value={farmForm.region} onChange={(e) => setF('region', e.target.value)} />
                </div>
                <div>
                  <label className="label">Total Hectares</label>
                  <input className="input" type="number" min="0" step="1" value={farmForm.totalHectares} onChange={(e) => setF('totalHectares', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={farmForm.address} onChange={(e) => setF('address', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={handleSaveFarm} disabled={farmSaving}>
                  {farmSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="btn-secondary" onClick={() => setFarmForm({
                  name: farm.name, owner: farm.owner, abn: farm.abn,
                  type: farm.type as FarmType, state: farm.state as State,
                  region: farm.region, totalHectares: String(farm.totalHectares), address: farm.address,
                })}>Discard</button>
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="card space-y-6">
              <h2 className="section-title">My Profile</h2>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-farm-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {profileForm.avatar || getInitials(profileForm.name || authUser?.email || 'Me')}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{profileForm.name || 'Your name'}</p>
                  <p className="text-xs text-gray-400 truncate">{demoMode ? 'demo@farmmap.app' : authUser?.email}</p>
                  {myProfile && <StatusBadge status={myProfile.role} label={myProfile.role} />}
                </div>
              </div>

              <div>
                <label className="label">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setProfileField('avatar', e)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 transition-colors ${profileForm.avatar === e ? 'border-farm-600 bg-farm-50 dark:bg-farm-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-farm-300'}`}
                    >
                      {e}
                    </button>
                  ))}
                  <button
                    type="button"
                    title="Use initials instead"
                    onClick={() => setProfileField('avatar', '')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-gray-500 border-2 transition-colors ${!profileForm.avatar ? 'border-farm-600 bg-farm-50 dark:bg-farm-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-farm-300'}`}
                  >
                    {getInitials(profileForm.name || 'Me')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={profileForm.name} onChange={(e) => setProfileField('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={profileForm.phone} onChange={(e) => setProfileField('phone', e.target.value)} placeholder="04xx xxx xxx" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input bg-gray-50 dark:bg-gray-800 text-gray-400" value={demoMode ? 'demo@farmmap.app' : authUser?.email ?? ''} disabled />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input className="input bg-gray-50 dark:bg-gray-800 text-gray-400 capitalize" value={myProfile?.role ?? 'owner'} disabled />
                </div>
              </div>

              <div>
                <button className="btn-primary" onClick={handleSaveProfile} disabled={demoMode || profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save Profile'}
                </button>
                {demoMode && <p className="text-xs text-gray-400 mt-2">Profile changes aren't saved in demo mode.</p>}
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Team Members</h2>
                <button className="btn-primary text-xs" onClick={() => toast.success('Invite user – coming in full release')}>
                  <Plus className="w-4 h-4" /> Invite User
                </button>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-farm-50/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-farm-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email} · Last login: {formatDate(u.lastLogin)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={u.role} label={u.role} />
                      <StatusBadge status={u.active ? 'active' : 'locked'} label={u.active ? 'Active' : 'Inactive'} />
                      <button className="btn-secondary text-xs py-1 px-2" onClick={() => setEditingUser(u)}>Edit</button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No team members added yet.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'alerts' && (
            <div className="card space-y-4">
              <h2 className="section-title">Notification Preferences</h2>
              {[
                { label: 'Task overdue alerts', desc: 'Get notified when tasks pass their due date' },
                { label: 'Low stock alerts', desc: 'Alert when inventory drops below minimum level' },
                { label: 'Equipment service due', desc: 'Reminder 2 weeks before scheduled service' },
                { label: 'Significant rainfall events', desc: 'Alert on rainfall > 25mm in 24 hours' },
                { label: 'Livestock health alerts', desc: 'Flag when animal status changes to sick/quarantine' },
                { label: 'Financial budget overruns', desc: 'Notify when actual spend exceeds budget by 10%' },
              ].map(n => (
                <label key={n.label} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 accent-farm-700 rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.label}</p>
                    <p className="text-xs text-gray-400">{n.desc}</p>
                  </div>
                </label>
              ))}
              <button className="btn-primary" onClick={() => toast.success('Notification preferences saved!')}>Save Preferences</button>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="card space-y-4">
              <h2 className="section-title">Integrations</h2>

              {/* ── John Deere Operations Center ────────────────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 border border-farm-200 dark:border-farm-800 bg-farm-50/50 dark:bg-farm-900/20 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-farm-700 flex items-center justify-center flex-shrink-0">
                    <Tractor className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">John Deere Operations Center</p>
                    <p className="text-xs text-gray-400">
                      {demoMode
                        ? 'Sign in with a real account to connect equipment telematics'
                        : johnDeere?.status === 'connected'
                          ? `Connected${johnDeere.externalOrgName ? ` as ${johnDeere.externalOrgName}` : ''} · Last synced ${formatDate(johnDeere.lastSyncAt) || 'never'}`
                          : johnDeere?.status === 'error'
                            ? `Connection error: ${johnDeere.lastError ?? 'unknown error'}`
                            : 'Sync machine hours, GPS location and field boundaries automatically'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${
                    johnDeere?.status === 'connected' ? 'bg-farm-100 text-farm-700'
                    : johnDeere?.status === 'error' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {demoMode ? 'unavailable in demo' : johnDeere?.status ?? 'disconnected'}
                  </span>
                  {!demoMode && johnDeere?.status === 'connected' ? (
                    <>
                      <button className="btn-secondary text-xs py-1.5" disabled={jdBusy !== null} onClick={handleSyncJohnDeere}>
                        <RefreshCw className={`w-3.5 h-3.5 ${jdBusy === 'sync' ? 'animate-spin' : ''}`} /> Sync Now
                      </button>
                      <button className="btn-secondary text-xs py-1.5 text-red-600 hover:bg-red-50" disabled={jdBusy !== null} onClick={handleDisconnectJohnDeere}>
                        <Unplug className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-secondary text-xs py-1.5"
                      disabled={demoMode || integrationsLoading || jdBusy !== null}
                      onClick={handleConnectJohnDeere}
                    >
                      {jdBusy === 'connect' ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Requires a one-time setup by the farm owner — see <code className="font-mono">docs/integrations/john-deere.md</code>.
              </p>

              {/* ── Xero Accounting ─────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 border border-farm-200 dark:border-farm-800 bg-farm-50/50 dark:bg-farm-900/20 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-farm-700 flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Xero Accounting</p>
                    <p className="text-xs text-gray-400">
                      {demoMode
                        ? 'Sign in with a real account to connect Xero'
                        : xero?.status === 'connected'
                          ? `Connected${xero.externalOrgName ? ` as ${xero.externalOrgName}` : ''} · Last synced ${formatDate(xero.lastSyncAt) || 'never'}`
                          : xero?.status === 'error'
                            ? `Connection error: ${xero.lastError ?? 'unknown error'}`
                            : 'Sync bank transactions and invoices with Xero'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${
                    xero?.status === 'connected' ? 'bg-farm-100 text-farm-700'
                    : xero?.status === 'error' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {demoMode ? 'unavailable in demo' : xero?.status ?? 'disconnected'}
                  </span>
                  {!demoMode && xero?.status === 'connected' ? (
                    <>
                      <button className="btn-secondary text-xs py-1.5" disabled={xeroBusy !== null} onClick={handleSyncXero}>
                        <RefreshCw className={`w-3.5 h-3.5 ${xeroBusy === 'sync' ? 'animate-spin' : ''}`} /> Sync Now
                      </button>
                      <button className="btn-secondary text-xs py-1.5 text-red-600 hover:bg-red-50" disabled={xeroBusy !== null} onClick={handleDisconnectXero}>
                        <Unplug className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-secondary text-xs py-1.5"
                      disabled={demoMode || integrationsLoading || xeroBusy !== null}
                      onClick={handleConnectXero}
                    >
                      {xeroBusy === 'connect' ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Requires a one-time setup by the farm owner — see <code className="font-mono">docs/integrations/xero.md</code>.
              </p>

              {/* ── Zepto Payments ──────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 border border-farm-200 dark:border-farm-800 bg-farm-50/50 dark:bg-farm-900/20 rounded-xl">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-farm-700 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Zepto Payments</p>
                    <p className="text-xs text-gray-400">
                      {demoMode
                        ? 'Sign in with a real account to connect Zepto'
                        : zepto?.status === 'connected'
                          ? `Connected${zepto.externalOrgName ? ` as ${zepto.externalOrgName}` : ''} · Last synced ${formatDate(zepto.lastSyncAt) || 'never'}`
                          : zepto?.status === 'error'
                            ? `Connection error: ${zepto.lastError ?? 'unknown error'}`
                            : 'Sync real-time bank payments (PayTo) as transactions'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${
                    zepto?.status === 'connected' ? 'bg-farm-100 text-farm-700'
                    : zepto?.status === 'error' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {demoMode ? 'unavailable in demo' : zepto?.status ?? 'disconnected'}
                  </span>
                  {!demoMode && zepto?.status === 'connected' ? (
                    <>
                      <button className="btn-secondary text-xs py-1.5" disabled={zeptoBusy !== null} onClick={handleSyncZepto}>
                        <RefreshCw className={`w-3.5 h-3.5 ${zeptoBusy === 'sync' ? 'animate-spin' : ''}`} /> Sync Now
                      </button>
                      <button className="btn-secondary text-xs py-1.5 text-red-600 hover:bg-red-50" disabled={zeptoBusy !== null} onClick={handleDisconnectZepto}>
                        <Unplug className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-secondary text-xs py-1.5"
                      disabled={demoMode || integrationsLoading}
                      onClick={() => setShowZeptoForm(true)}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Uses an API key from your Zepto merchant dashboard, not a sign-in redirect — see <code className="font-mono">docs/integrations/zepto.md</code>.
              </p>

              {[
                { name: 'BOM Weather API', desc: 'Bureau of Meteorology live weather data', status: 'disconnected' },
                { name: 'NLIS Database', desc: 'National Livestock Identification System', status: 'disconnected' },
                { name: 'MYOB AccountRight', desc: 'Sync transactions with MYOB', status: 'disconnected' },
                { name: 'AgriWebbTM', desc: 'Livestock management platform sync', status: 'disconnected' },
                { name: 'GrainCorp Portal', desc: 'Grain receival and prices', status: 'disconnected' },
              ].map(i => (
                <div key={i.name} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 border border-gray-100 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{i.name}</p>
                    <p className="text-xs text-gray-400">{i.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-gray-100 text-gray-500">{i.status}</span>
                    <button className="btn-secondary text-xs py-1.5" onClick={() => toast(`Connect ${i.name} – coming in full release`)}>Connect</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'devices' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="section-title">Registered Devices</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Tablets and phones set up for Tractor Mode in the cab.</p>
                </div>
                <button className="btn-primary text-xs" onClick={() => setShowRegisterDevice(true)}>
                  <Plus className="w-4 h-4" /> Register This Device
                </button>
              </div>

              {paired && (thisDevice || demoMode) && (
                <div className="flex items-center gap-2 text-xs text-farm-700 dark:text-farm-300 bg-farm-50 dark:bg-farm-900/20 border border-farm-200 dark:border-farm-800 rounded-xl px-3 py-2 flex-wrap">
                  <Smartphone className="w-4 h-4 flex-shrink-0" />
                  This device is registered as <strong>&ldquo;{paired.name}&rdquo;</strong>.
                  <button className="ml-auto underline font-medium" onClick={handleForgetDevice}>Forget this device</button>
                </div>
              )}
              {paired && !thisDevice && !demoMode && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 flex-wrap">
                  This browser was paired as &ldquo;{paired.name}&rdquo; but that record no longer exists.
                  <button className="ml-auto underline font-medium" onClick={handleForgetDevice}>Forget it</button>
                </div>
              )}

              <div className="space-y-3">
                {devices.map((d) => {
                  const assignedUser = users.find((u) => u.id === d.assignedUserId);
                  return (
                    <div key={d.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border ${d.status === 'revoked' ? 'border-red-100 dark:border-red-900 bg-red-50/40 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.status === 'revoked' ? 'bg-red-100 text-red-600' : 'bg-farm-100 text-farm-700'}`}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                            {d.name}
                            {paired?.deviceId === d.id && <span className="badge bg-sky-100 text-sky-700 text-[10px]">this device</span>}
                          </p>
                          <p className="text-xs text-gray-400">
                            {assignedUser ? `Usually ${assignedUser.name}` : 'Unassigned'} · Last active {formatDate(d.lastActiveAt) || 'never'}
                          </p>
                          {d.lastLocation && (
                            <p className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {(() => {
                                const p = findContainingPaddock(d.lastLocation, paddocks);
                                return p ? `In ${p.name}` : `Near ${formatCoords(d.lastLocation)}`;
                              })()}
                              {' · '}{timeAgo(d.lastLocationAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          className="input text-xs py-1 w-36"
                          value={d.assignedUserId ?? ''}
                          onChange={(e) => assignDevice(d.id, e.target.value || undefined)}
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <StatusBadge status={d.status === 'active' ? 'active' : 'locked'} label={d.status === 'active' ? 'Active' : 'Revoked'} />
                        {d.status === 'active' ? (
                          <button className="btn-secondary text-xs py-1 px-2 text-red-600 hover:bg-red-50" onClick={() => handleRevokeDevice(d.id, d.name)}>
                            <Unplug className="w-3.5 h-3.5" /> Revoke
                          </button>
                        ) : (
                          <button className="btn-secondary text-xs py-1 px-2" onClick={() => reactivateDevice(d.id)}>
                            <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove device" onClick={() => handleDeleteDevice(d.id, d.name)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {devices.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No devices registered yet.</p>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Revoking a device signs it out next time it checks in — see <code className="font-mono">docs/DEVICES.md</code>.
              </p>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Recent Geofence Activity</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Logged automatically when a device's GPS position crosses a paddock boundary — see <code className="font-mono">docs/GEOFENCING.md</code>.
                </p>
                <div className="space-y-1.5">
                  {geofenceEvents.slice(0, 8).map((ev) => {
                    const device = devices.find((d) => d.id === ev.deviceId);
                    const paddock = paddocks.find((p) => p.id === ev.paddockId);
                    return (
                      <div key={ev.id} className="flex items-center gap-2.5 text-sm py-1.5">
                        {ev.type === 'enter'
                          ? <LogIn className="w-3.5 h-3.5 text-farm-600 flex-shrink-0" />
                          : <LogOutIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                        <span className="font-medium text-gray-700 dark:text-gray-300">{device?.name ?? 'Unknown device'}</span>
                        <span className="text-gray-400">{ev.type === 'enter' ? 'entered' : 'left'}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{paddock?.name ?? 'a paddock'}</span>
                        <span className="text-gray-400 ml-auto flex-shrink-0">{timeAgo(ev.occurredAt)}</span>
                      </div>
                    );
                  })}
                  {geofenceEvents.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-3">No geofence crossings logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="card space-y-4">
              <h2 className="section-title">Data Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">Export All Data</p>
                  <p className="text-xs text-gray-400 mb-3">Download complete farm data as JSON</p>
                  <button className="btn-secondary text-xs" onClick={exportAllData}>Export JSON</button>
                </div>
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">Import Transactions</p>
                  <p className="text-xs text-gray-400 mb-3">Import a CSV of transactions (Date, Description, Category, Type, Amount)</p>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportCSV(f); e.target.value = ''; }}
                  />
                  <button className="btn-secondary text-xs" disabled={importing} onClick={() => importFileRef.current?.click()}>
                    {importing ? 'Importing…' : 'Import CSV'}
                  </button>
                </div>
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">Automatic Backups</p>
                  <p className="text-xs text-gray-400 mb-3">Data backed up daily to secure cloud storage</p>
                  <span className="badge bg-green-100 text-green-700">Enabled</span>
                </div>
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">Offline Mode</p>
                  <p className="text-xs text-gray-400 mb-3">Works in the paddock without internet (PWA)</p>
                  <span className="badge bg-green-100 text-green-700">Active</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="card space-y-4">
              <h2 className="section-title">Change Password</h2>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" placeholder="Min. 6 characters"
                    value={pwForm.newPw} onChange={(e) => setPw('newPw', e.target.value)} />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" placeholder="••••••••"
                    value={pwForm.confirmPw} onChange={(e) => setPw('confirmPw', e.target.value)} />
                </div>
                <button className="btn-primary" onClick={handleChangePassword} disabled={pwSaving}>
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
              <div className="border-t pt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-farm-700" />
                  <div>
                    <p className="text-sm font-medium">Session timeout after 8 hours</p>
                    <p className="text-xs text-gray-400">Auto-logout on tractor or tablet screens</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showZeptoForm}
        onClose={() => setShowZeptoForm(false)}
        title="Connect Zepto"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowZeptoForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleConnectZepto} disabled={zeptoBusy !== null}>
              {zeptoBusy === 'connect' ? 'Connecting…' : 'Connect'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Paste the API key from your Zepto merchant dashboard. It's stored server-side and never
            visible in FarmMap after this.
          </p>
          <div>
            <label className="label">Zepto API Key</label>
            <input
              className="input font-mono text-sm"
              type="password"
              placeholder="zpk_live_…"
              value={zeptoApiKey}
              onChange={(e) => setZeptoApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showRegisterDevice}
        onClose={() => setShowRegisterDevice(false)}
        title="Register This Device"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowRegisterDevice(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleRegisterDevice} disabled={deviceSaving}>
              {deviceSaving ? 'Registering…' : 'Register'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This registers the device you're using right now — do this from the tablet or phone
            that's actually mounted in the cab. It'll launch straight into Tractor Mode from now on,
            and can be renamed or revoked from here on any device.
          </p>
          <div>
            <label className="label">Device Name</label>
            <input className="input" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="e.g. 8R Cab Tablet" autoFocus />
          </div>
          <div>
            <label className="label">Usually used by (optional)</label>
            <select className="input" value={deviceAssignee} onChange={(e) => setDeviceAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
