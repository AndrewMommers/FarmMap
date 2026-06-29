import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { formatDate } from '../lib/utils';
import { useFarmData } from '../hooks/useFarmData';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck, AlertTriangle, FileText, FlaskConical } from 'lucide-react';

const COMPLIANCE_DOCS = [
  { id: 'd-1', name: 'Chemical Use Register 2024–25', type: 'register', status: 'current', updated: '2025-06-15', size: '142 KB' },
  { id: 'd-2', name: 'MSDS – Glyphosate 450',          type: 'msds',     status: 'current', updated: '2024-01-01', size: '380 KB' },
  { id: 'd-3', name: 'MSDS – Trifluralin 480',          type: 'msds',     status: 'current', updated: '2024-01-01', size: '310 KB' },
  { id: 'd-4', name: 'MSDS – Chlorpyrifos 500',         type: 'msds',     status: 'current', updated: '2024-03-15', size: '420 KB' },
  { id: 'd-5', name: 'Farm Chemical Licence – Owner',   type: 'licence',  status: 'current', updated: '2023-07-01', size: '88 KB'  },
  { id: 'd-6', name: 'Property Identification Code (PIC)', type: 'regulatory', status: 'current', updated: '2020-01-15', size: '45 KB' },
  { id: 'd-7', name: 'Biosecurity Management Plan',     type: 'regulatory', status: 'review_due', updated: '2022-09-01', size: '218 KB' },
  { id: 'd-8', name: 'National Vendor Declaration (NVD) template', type: 'nvd', status: 'current', updated: '2025-01-01', size: '62 KB' },
];

export function CompliancePage() {
  const { sprayRecords, paddocks } = useFarmData();
  const [tab, setTab] = useState<'register' | 'docs' | 'whp'>('register');
  const [search, setSearch] = useState('');

  // Map live spray records into a chemical-register shape
  const chemicalRegister = useMemo(() =>
    sprayRecords
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(s => {
        const paddock = paddocks.find(p => p.id === s.paddockId);
        const totalQty = paddock ? s.ratePerHa * paddock.hectares : null;
        return {
          id:              s.id,
          date:            s.date,
          product:         s.product,
          purpose:         s.purpose,
          paddock:         paddock?.name ?? '—',
          ratePerHa:       s.ratePerHa,
          unit:            s.unit,
          totalUsed:       totalQty != null ? `${Math.round(totalQty).toLocaleString()} ${s.unit}` : '—',
          operator:        s.operator,
          withholdingDays: s.withholdingDays ?? 0,
          notes:           s.notes ?? '',
        };
      }),
  [sprayRecords, paddocks]);

  const withholdingAlerts = useMemo(() =>
    chemicalRegister.filter(e => {
      if (e.withholdingDays === 0) return false;
      const clearDate = new Date(e.date);
      clearDate.setDate(clearDate.getDate() + e.withholdingDays);
      return clearDate > new Date();
    }),
  [chemicalRegister]);

  const filtered = chemicalRegister.filter(e =>
    e.product.toLowerCase().includes(search.toLowerCase()) ||
    e.paddock.toLowerCase().includes(search.toLowerCase()) ||
    e.operator.toLowerCase().includes(search.toLowerCase())
  );

  const getWHPClear = (date: string, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const docStatusColor: Record<string, string> = {
    current:    'bg-green-100 text-green-800',
    review_due: 'bg-amber-100 text-amber-800',
    expired:    'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Chemical Register"
        subtitle="Spray records, withholding periods, and regulatory documents"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => toast('Export register – coming soon')}>
              <FileText className="w-4 h-4" /> Export PDF
            </button>
            <button className="btn-primary" onClick={() => toast.success('Add spray record via the Crops or Paddocks pages')}>
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Chemical Events" value={chemicalRegister.length} subtitle="All spray records" icon={<FlaskConical className="w-5 h-5" />} color="blue" />
        <StatCard title="Active WHP Alerts" value={withholdingAlerts.length} subtitle="Withholding in effect" icon={<AlertTriangle className="w-5 h-5" />} color={withholdingAlerts.length > 0 ? 'amber' : 'green'} />
        <StatCard title="Compliance Docs" value={COMPLIANCE_DOCS.length} icon={<FileText className="w-5 h-5" />} color="purple" />
        <StatCard title="Licence Status" value="Current" subtitle="Renew annually" icon={<ShieldCheck className="w-5 h-5" />} color="green" />
      </div>

      {/* WHP Alert banner */}
      {withholdingAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 dark:bg-amber-900/20 dark:border-amber-700">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Active Withholding Periods
          </p>
          <div className="space-y-1">
            {withholdingAlerts.map(e => (
              <p key={e.id} className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{e.product}</strong> on {e.paddock} — clear date:{' '}
                <strong>{formatDate(getWHPClear(e.date, e.withholdingDays))}</strong> ({e.withholdingDays} days WHP)
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
          {([
            { id: 'register', label: 'Chemical Register' },
            { id: 'whp',      label: 'WHP Tracker' },
            { id: 'docs',     label: 'Documents' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-farm-700 text-white' : 'text-gray-500 hover:text-farm-700 dark:hover:text-farm-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'register' && (
          <SearchBar value={search} onChange={setSearch} placeholder="Search chemical register…" className="w-52 ml-auto" />
        )}
      </div>

      {/* Chemical Register Table */}
      {tab === 'register' && (
        <div className="card overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              {chemicalRegister.length === 0
                ? 'No spray records yet. Add spray events when recording paddock activity.'
                : 'No records match your search.'}
            </p>
          ) : (
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  {['Date', 'Product', 'Purpose', 'Paddock', 'Rate/ha', 'Total Used', 'Operator', 'WHP'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-farm-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="table-cell whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="table-cell font-semibold text-gray-900 dark:text-gray-100">{e.product}</td>
                    <td className="table-cell text-xs text-gray-500 capitalize">{e.purpose}</td>
                    <td className="table-cell font-medium">{e.paddock}</td>
                    <td className="table-cell">{e.ratePerHa > 0 ? `${e.ratePerHa} ${e.unit}` : 'N/A'}</td>
                    <td className="table-cell font-semibold">{e.totalUsed}</td>
                    <td className="table-cell">{e.operator}</td>
                    <td className={`table-cell font-bold ${e.withholdingDays > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {e.withholdingDays > 0 ? `${e.withholdingDays}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-gray-400 mt-3 px-2">
            * All records retained for minimum 3 years as required by state agricultural chemical regulations.
          </p>
        </div>
      )}

      {/* WHP Tracker */}
      {tab === 'whp' && (
        <div className="space-y-3">
          {chemicalRegister.filter(e => e.withholdingDays > 0).length === 0 && (
            <div className="card text-center py-8 text-gray-400">No withholding period records found.</div>
          )}
          {chemicalRegister.filter(e => e.withholdingDays > 0).map(e => {
            const clearDate = getWHPClear(e.date, e.withholdingDays);
            const today = new Date();
            const clear = new Date(clearDate);
            const daysLeft = Math.ceil((clear.getTime() - today.getTime()) / 86400000);
            const cleared = daysLeft <= 0;

            return (
              <div key={e.id} className={`card flex flex-wrap items-center gap-4 ${cleared ? 'opacity-60' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${cleared ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {cleared ? '✅' : '⏳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{e.product}</p>
                  <p className="text-sm text-gray-500">Applied: {formatDate(e.date)} on {e.paddock} · by {e.operator}</p>
                  {e.notes && <p className="text-xs text-gray-400 mt-0.5">{e.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{e.withholdingDays}d WHP</p>
                  <p className="text-sm font-bold">
                    {cleared
                      ? <span className="text-farm-600">Cleared</span>
                      : <span className="text-amber-600">{daysLeft}d remaining</span>}
                  </p>
                  <p className="text-xs text-gray-400">Clear: {formatDate(clearDate)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Documents */}
      {tab === 'docs' && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                {['Document', 'Type', 'Status', 'Last Updated', 'Size', 'Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_DOCS.map(doc => (
                <tr key={doc.id} className="hover:bg-farm-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-farm-500 flex-shrink-0" />
                    {doc.name}
                  </td>
                  <td className="table-cell capitalize text-xs text-gray-500">{doc.type.replace('_', ' ')}</td>
                  <td className="table-cell">
                    <span className={`badge ${docStatusColor[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-cell">{formatDate(doc.updated)}</td>
                  <td className="table-cell text-gray-400">{doc.size}</td>
                  <td className="table-cell">
                    <button className="btn-secondary text-xs py-1 px-2.5" onClick={() => toast(`Opening ${doc.name}…`, { icon: '📄' })}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
