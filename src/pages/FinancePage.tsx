import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { StatCard } from '../components/ui/StatCard';
import { AddTransactionModal } from '../components/modals/AddTransactionModal';
import { useFarmData } from '../hooks/useFarmData';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { TransactionCategory } from '../types';

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  livestock_sale: 'Livestock Sale', crop_sale: 'Crop Sale', produce_sale: 'Produce',
  agistment: 'Agistment', government_payment: 'Gov. Payment',
  fuel: 'Fuel', fertiliser: 'Fertiliser', chemical: 'Chemical/Ag', seed: 'Seed',
  feed: 'Stock Feed', veterinary: 'Veterinary', labour: 'Labour',
  machinery: 'Machinery', repairs: 'Repairs', insurance: 'Insurance',
  rates: 'Rates & Taxes', utilities: 'Utilities', freight: 'Freight',
  professional_fees: 'Professional Fees', other_income: 'Other Income',
  other_expense: 'Other Expense',
};

export function FinancePage() {
  const { transactions, budgets } = useFarmData();
  const [tab, setTab] = useState<'ledger' | 'budget'>('ledger');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddTx, setShowAddTx] = useState(false);

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amountAUD, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountAUD, 0);
  const gstCollected = transactions.filter(t => t.type === 'income' && t.gstIncluded).reduce((s, t) => s + t.amountAUD / 11, 0);
  const gstCredits = transactions.filter(t => t.type === 'expense' && t.gstIncluded).reduce((s, t) => s + t.amountAUD / 11, 0);

  const filtered = transactions.filter(t => {
    const q = t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.supplier ?? '').toLowerCase().includes(search.toLowerCase());
    const type = typeFilter === 'all' || t.type === typeFilter;
    return q && type;
  });

  // Budget vs actual
  const budgetData = budgets.map(b => {
    const actual = transactions
      .filter(t => t.category === b.category)
      .reduce((s, t) => s + t.amountAUD, 0);
    return {
      name: CATEGORY_LABELS[b.category] ?? b.category,
      budget: b.budgetedAUD,
      actual,
    };
  });

  return (
    <div className="space-y-6">
      <AddTransactionModal open={showAddTx} onClose={() => setShowAddTx(false)} />
      <PageHeader
        title="Finance & Accounts"
        subtitle="GST-inclusive Australian farm accounts"
        actions={
          <>
            <button className="btn-secondary" onClick={() => toast('Export to CSV – coming soon')}>Export</button>
            <button className="btn-primary" onClick={() => setShowAddTx(true)}>
              <Plus className="w-4 h-4" /> New Transaction
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="YTD Income" value={formatCurrency(income)} icon={<TrendingUp className="w-5 h-5" />} color="green" trend={{ value: 12, label: 'vs last year' }} />
        <StatCard title="YTD Expenses" value={formatCurrency(expense)} icon={<TrendingDown className="w-5 h-5" />} color="red" />
        <StatCard title="Net Position" value={formatCurrency(income - expense)} icon={<DollarSign className="w-5 h-5" />} color={income > expense ? 'green' : 'red'} />
        <StatCard title="GST Payable (net)" value={formatCurrency(gstCollected - gstCredits)} subtitle="Collected less credits" icon={<DollarSign className="w-5 h-5" />} color="blue" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
          <button onClick={() => setTab('ledger')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'ledger' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}>Ledger</button>
          <button onClick={() => setTab('budget')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'budget' ? 'bg-farm-700 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-farm-700 dark:hover:text-farm-300'}`}>Budget vs Actual</button>
        </div>
        {tab === 'ledger' && (
          <>
            {(['all', 'income', 'expense'] as const).map(f => (
              <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${typeFilter === f ? 'bg-farm-700 text-white border-farm-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-farm-300'}`}>{f}</button>
            ))}
            <SearchBar value={search} onChange={setSearch} placeholder="Search…" className="w-48 ml-auto" />
          </>
        )}
      </div>

      {tab === 'ledger' ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {['Date', 'Description', 'Category', 'Type', 'GST', 'Amount (AUD)', 'Supplier / Notes'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-farm-50/50 transition-colors">
                  <td className="table-cell whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="table-cell font-medium text-gray-900 dark:text-gray-100 max-w-xs">{t.description}</td>
                  <td className="table-cell text-xs text-gray-500">{CATEGORY_LABELS[t.category] ?? t.category}</td>
                  <td className="table-cell">
                    <span className={`badge ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>{t.type}</span>
                  </td>
                  <td className="table-cell text-xs">{t.gstIncluded ? '✓ incl.' : 'N/A'}</td>
                  <td className={`table-cell font-bold ${t.type === 'income' ? 'text-farm-700' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amountAUD)}
                  </td>
                  <td className="table-cell text-xs text-gray-400">{t.supplier ?? t.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-farm-50">
                <td colSpan={5} className="table-cell font-bold text-gray-700">Net Position</td>
                <td className={`table-cell font-extrabold text-lg ${income - expense >= 0 ? 'text-farm-700' : 'text-red-600'}`}>
                  {formatCurrency(income - expense)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="card">
          <h2 className="section-title mb-4">Budget vs Actual – FY 2024–25</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={budgetData} margin={{ top: 0, right: 0, left: -10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="budget" name="Budget" fill="#86efac" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                {budgetData.map((entry, i) => (
                  <Cell key={i} fill={entry.actual > entry.budget ? '#ef4444' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Green = under budget · Red = over budget</p>
        </div>
      )}
    </div>
  );
}
