import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import type { LivestockMobGroup, LivestockAnimal } from '../../types';
import toast from 'react-hot-toast';

interface AddLivestockModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddLivestockModal({ open, onClose }: AddLivestockModalProps) {
  const { activeFarmId } = useAppStore();
  const addLivestockMob = useDataStore((s) => s.addLivestockMob);
  const addLivestockAnimal = useDataStore((s) => s.addLivestockAnimal);
  const [mode, setMode] = useState<'mob' | 'individual'>('mob');
  const [form, setForm] = useState({
    name: '', species: 'sheep', count: '', breed: '',
    tag: '', gender: 'female', dob: '', weightKg: '', notes: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (mode === 'mob' && (!form.name || !form.count)) { toast.error('Name and count required'); return; }
    if (mode === 'individual' && !form.tag) { toast.error('NLIS tag is required'); return; }
    if (mode === 'mob') {
      addLivestockMob(activeFarmId, {
        name: form.name,
        species: form.species as LivestockMobGroup['species'],
        count: parseInt(form.count, 10),
        paddockId: undefined,
        notes: form.notes || undefined,
      });
      toast.success(`Mob "${form.name}" (${form.count} head) added!`);
    } else {
      addLivestockAnimal(activeFarmId, {
        tag: form.tag,
        species: form.species as LivestockAnimal['species'],
        breed: form.breed || 'Unknown',
        gender: form.gender as LivestockAnimal['gender'],
        dob: form.dob || undefined,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        status: 'healthy',
        paddockId: undefined,
        notes: form.notes || undefined,
      });
      toast.success(`Animal tag ${form.tag} added!`);
    }
    onClose();
    setForm({ name: '', species: 'sheep', count: '', breed: '', tag: '', gender: 'female', dob: '', weightKg: '', notes: '' });
  };

  const SPECIES = ['sheep', 'cattle', 'goat', 'pig', 'chicken', 'turkey', 'horse', 'alpaca', 'other'];
  const BREEDS_BY_SPECIES: Record<string, string[]> = {
    sheep: ['Merino', 'Poll Dorset', 'Corriedale', 'White Suffolk', 'Other'],
    cattle: ['Angus', 'Hereford', 'Murray Grey', 'Droughtmaster', 'Brahman', 'Charolais', 'Other'],
    goat: ['Boer', 'Cashmere', 'Angora', 'Other'],
    other: ['Other'],
  };
  const breeds = BREEDS_BY_SPECIES[form.species] ?? ['Other'];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Livestock"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['mob', 'individual'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${mode === m ? 'bg-farm-700 text-white border-farm-700' : 'bg-white text-gray-600 border-gray-200'}`}>
              {m === 'mob' ? 'Mob / Group' : 'Individual Animal'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Species</label>
            <select className="input" value={form.species} onChange={(e) => set('species', e.target.value)}>
              {SPECIES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Breed</label>
            <select className="input" value={form.breed} onChange={(e) => set('breed', e.target.value)}>
              <option value="">Select…</option>
              {breeds.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          {mode === 'mob' ? (
            <>
              <div className="col-span-2">
                <label className="label">Group Name *</label>
                <input className="input" placeholder="e.g. Merino Ewes – Bore Run" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Head Count *</label>
                <input className="input" type="number" min="1" placeholder="0" value={form.count} onChange={(e) => set('count', e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2">
                <label className="label">NLIS Tag *</label>
                <input className="input" placeholder="e.g. NSW1234567" value={form.tag} onChange={(e) => set('tag', e.target.value)} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="castrated">Castrated</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input className="input" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
              </div>
            </>
          )}

          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
