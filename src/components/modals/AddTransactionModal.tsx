import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import type { Transaction } from '../../types';
import toast from 'react-hot-toast';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

const INCOME_CATEGORIES = [
  { value: 'livestock_sale', label: 'Livestock Sale' },
  { value: 'crop_sale', label: 'Crop Sale' },
  { value: 'produce_sale', label: 'Produce Sale' },
  { value: 'agistment', label: 'Agistment' },
  { value: 'government_payment', label: 'Gov. Payment' },
  { value: 'other_income', label: 'Other Income' },
];
const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'fertiliser', label: 'Fertiliser' },
  { value: 'chemical', label: 'Chemical/Ag' },
  { value: 'seed', label: 'Seed' },
  { value: 'feed', label: 'Stock Feed' },
  { value: 'veterinary', label: 'Veterinary' },
  { value: 'labour', label: 'Labour' },
  { value: 'machinery', label: 'Machinery' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'rates', label: 'Rates & Taxes' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'freight', label: 'Freight' },
  { value: 'professional_fees', label: 'Professional Fees' },
  { value: 'other_expense', label: 'Other Expense' },
];

export function AddTransactionModal({ open, onClose }: AddTransactionModalProps) {
  const { activeFarmId } = useAppStore();
  const addTransaction = useDataStore((s) => s.addTransaction);
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().slice(0, 10),
    category: 'fuel',
    description: '',
    amount: '',
    gstIncluded: true,
    supplier: '',
    invoiceNumber: '',
    notes: '',
  });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = () => {
    if (!form.description || !form.amount) { toast.error('Description and amount are required'); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
    addTransaction(activeFarmId, {
      type: form.type as Transaction['type'],
      date: form.date,
      category: form.category as Transaction['category'],
      description: form.description,
      amountAUD: amt,
      gstIncluded: form.gstIncluded,
      supplier: form.supplier || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      notes: form.notes || undefined,
    });
    toast.success(`Transaction recorded: ${form.type === 'income' ? '+' : '-'}$${amt.toLocaleString('en-AU')}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Transaction"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Record Transaction</button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          {(['income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { set('type', t); set('category', t === 'income' ? 'livestock_sale' : 'fuel'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                form.type === t
                  ? t === 'income' ? 'bg-farm-700 text-white border-farm-700' : 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {t === 'income' ? '+ Income' : '− Expense'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Amount (AUD) *</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Description *</label>
            <input className="input" placeholder="e.g. Merino wool clip – 42 bales" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Supplier / Payer</label>
            <input className="input" placeholder="e.g. Elders Wool" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
          </div>
          <div>
            <label className="label">Invoice / Receipt #</label>
            <input className="input" placeholder="INV-0001" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <input
              id="gst"
              type="checkbox"
              checked={form.gstIncluded}
              onChange={(e) => set('gstIncluded', e.target.checked)}
              className="w-4 h-4 accent-farm-700 rounded"
            />
            <label htmlFor="gst" className="text-sm text-gray-700 cursor-pointer">
              GST included in amount
              {form.gstIncluded && form.amount && !isNaN(parseFloat(form.amount)) && (
                <span className="ml-2 text-gray-400">(GST = ${(parseFloat(form.amount) / 11).toFixed(2)})</span>
              )}
            </label>
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
