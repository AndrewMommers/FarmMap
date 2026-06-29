import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useFarmData } from '../hooks/useFarmData';
import { formatDate, getInitials } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Settings, Users, Bell, Globe, Database, Shield } from 'lucide-react';

const TABS = [
  { id: 'general',  label: 'General',     icon: <Settings className="w-4 h-4" /> },
  { id: 'users',    label: 'Users & Access', icon: <Users className="w-4 h-4" /> },
  { id: 'alerts',   label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Globe className="w-4 h-4" /> },
  { id: 'data',     label: 'Data & Backup', icon: <Database className="w-4 h-4" /> },
  { id: 'security', label: 'Security',     icon: <Shield className="w-4 h-4" /> },
];

export function SettingsPage() {
  const { users, farm } = useFarmData();
  const [tab, setTab] = useState('general');

  return (
    <div className="space-y-6">
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
                {[
                  { label: 'Farm Name', value: farm.name },
                  { label: 'Owner', value: farm.owner },
                  { label: 'ABN', value: farm.abn },
                  { label: 'Farm Type', value: farm.type },
                  { label: 'State', value: farm.state },
                  { label: 'Region', value: farm.region },
                  { label: 'Total Hectares', value: `${farm.totalHectares} ha` },
                  { label: 'Address', value: farm.address },
                ].map(f => (
                  <div key={f.label}>
                    <label className="label">{f.label}</label>
                    <input className="input" defaultValue={f.value} onChange={() => {}} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={() => toast.success('Farm details saved!')}>Save Changes</button>
                <button className="btn-secondary" onClick={() => toast('Changes discarded')}>Discard</button>
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
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-farm-50/50">
                    <div className="w-10 h-10 rounded-full bg-farm-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email} · Last login: {formatDate(u.lastLogin)}</p>
                    </div>
                    <StatusBadge status={u.role} label={u.role} />
                    <StatusBadge status={u.active ? 'active' : 'locked'} label={u.active ? 'Active' : 'Inactive'} />
                    <button className="btn-secondary text-xs py-1 px-2" onClick={() => toast('Edit user – coming soon')}>Edit</button>
                  </div>
                ))}
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
              {[
                { name: 'BOM Weather API', desc: 'Bureau of Meteorology live weather data', status: 'disconnected' },
                { name: 'NLIS Database', desc: 'National Livestock Identification System', status: 'disconnected' },
                { name: 'Xero Accounting', desc: 'Sync transactions with Xero', status: 'disconnected' },
                { name: 'MYOB AccountRight', desc: 'Sync transactions with MYOB', status: 'disconnected' },
                { name: 'AgriWebbTM', desc: 'Livestock management platform sync', status: 'disconnected' },
                { name: 'GrainCorp Portal', desc: 'Grain receival and prices', status: 'disconnected' },
              ].map(i => (
                <div key={i.name} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{i.name}</p>
                    <p className="text-xs text-gray-400">{i.desc}</p>
                  </div>
                  <span className="badge bg-gray-100 text-gray-500">{i.status}</span>
                  <button className="btn-secondary text-xs py-1.5" onClick={() => toast(`Connect ${i.name} – coming in full release`)}>Connect</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'data' && (
            <div className="card space-y-4">
              <h2 className="section-title">Data Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">Export All Data</p>
                  <p className="text-xs text-gray-400 mb-3">Download complete farm data as JSON or CSV</p>
                  <button className="btn-secondary text-xs" onClick={() => toast('Export data – coming soon')}>Export JSON</button>
                </div>
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">Import Data</p>
                  <p className="text-xs text-gray-400 mb-3">Import from AgData, FarmLink, or CSV</p>
                  <button className="btn-secondary text-xs" onClick={() => toast('Import data – coming soon')}>Import CSV</button>
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
              <h2 className="section-title">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <button className="btn-primary" onClick={() => toast.success('Password updated!')}>Update Password</button>
              </div>
              <div className="border-t pt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-farm-700" />
                  <div>
                    <p className="text-sm font-medium">Two-factor authentication</p>
                    <p className="text-xs text-gray-400">Receive SMS code on login</p>
                  </div>
                </label>
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
    </div>
  );
}
