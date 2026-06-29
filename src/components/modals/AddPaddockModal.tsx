import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import { FarmMapLeaflet, DRAW_COLORS, type DrawnPaddock } from '../map/FarmMapLeaflet';
import { useFarmData } from '../../hooks/useFarmData';
import type { Paddock } from '../../types';
import toast from 'react-hot-toast';
import { MapPin, PenLine } from 'lucide-react';

interface AddPaddockModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Paddock;
}

const SOIL_TYPES = [
  'Red Kandosol', 'Grey Vertosol', 'Black Vertosol', 'Red Sodosol',
  'Red Earth', 'Red Chromosol', 'Sandy loam', 'Mitchell grass', 'Clay loam', 'Other',
];

export function AddPaddockModal({ open, onClose, initialData }: AddPaddockModalProps) {
  const { activeFarmId } = useAppStore();
  const addPaddock = useDataStore((s) => s.addPaddock);
  const updatePaddock = useDataStore((s) => s.updatePaddock);
  const { farm } = useFarmData();
  const isEdit = !!initialData;

  const [step, setStep] = useState<'form' | 'draw'>('form');
  const [drawn, setDrawn] = useState<DrawnPaddock | null>(null);
  const [form, setForm] = useState({
    name: '', hectares: '', soilType: 'Red Kandosol',
    status: 'active', currentCrop: '', notes: '', color: DRAW_COLORS[0],
  });

  useEffect(() => {
    if (open) {
      setForm(initialData ? {
        name: initialData.name,
        hectares: initialData.hectares.toString(),
        soilType: initialData.soilType,
        status: initialData.status,
        currentCrop: initialData.currentCrop ?? '',
        notes: initialData.notes ?? '',
        color: initialData.color ?? DRAW_COLORS[0],
      } : { name: '', hectares: '', soilType: 'Red Kandosol', status: 'active', currentCrop: '', notes: '', color: DRAW_COLORS[0] });
      setDrawn(null);
    }
  }, [open]); // eslint-disable-line

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleDrawComplete = (d: DrawnPaddock) => {
    setDrawn(d);
    setStep('form');
    if (!form.hectares) setForm((f) => ({ ...f, hectares: String(d.hectares) }));
    // Capture the colour chosen during drawing
    if (d.color) setForm((f) => ({ ...f, color: d.color! }));
    toast.success(`Boundary drawn · ~${d.hectares} ha estimated`);
  };

  const handleSave = () => {
    if (!form.name) { toast.error('Paddock name is required'); return; }
    const ha = parseFloat(form.hectares);
    if (!ha) { toast.error('Area is required'); return; }

    if (isEdit && initialData) {
      updatePaddock(initialData.id, {
        name:        form.name,
        hectares:    ha,
        soilType:    form.soilType,
        status:      form.status as Paddock['status'],
        currentCrop: form.currentCrop || undefined,
        notes:       form.notes || undefined,
        color:       form.color || undefined,
        ...(drawn ? { polygon: drawn.polygon, coordinates: drawn.centroid } : {}),
      });
      toast.success(`Paddock "${form.name}" updated!`);
    } else {
      addPaddock(activeFarmId, {
        name:          form.name,
        hectares:      ha,
        soilType:      form.soilType,
        status:        form.status as Paddock['status'],
        currentCrop:   form.currentCrop || undefined,
        notes:         form.notes || undefined,
        color:         form.color || undefined,
        lastActivity:  new Date().toISOString().slice(0, 10),
        polygon:       drawn?.polygon,
        coordinates:   drawn?.centroid,
      });
      toast.success(`Paddock "${form.name}" added!`);
    }
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setStep('form');
    setDrawn(null);
    setForm({ name: '', hectares: '', soilType: 'Red Kandosol', status: 'active', currentCrop: '', notes: '', color: DRAW_COLORS[0] });
  };

  // ── Map drawing step ──────────────────────────────────────────────────────
  if (step === 'draw') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep('form')} className="btn-secondary text-sm py-1.5">← Back</button>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Draw Paddock Boundary</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-2 hidden sm:block">
            Click on the satellite map to place boundary points · Double-click or press ✓ to close
          </p>
          <button onClick={handleClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {/* Full-screen map */}
        <div className="flex-1">
          <FarmMapLeaflet
            paddocks={[]}
            address={farm?.address}
            onDrawComplete={handleDrawComplete}
          />
        </div>
      </div>
    );
  }

  // ── Form step ──────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Paddock' : 'Add Paddock'}
      footer={
        <>
          <button className="btn-secondary" onClick={handleClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Save Paddock'}</button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Draw boundary CTA */}
        <button
          type="button"
          onClick={() => setStep('draw')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
            drawn
              ? 'border-farm-500 bg-farm-50 dark:bg-farm-900/20'
              : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-farm-400 hover:bg-farm-50/50'
          }`}
        >
          {drawn ? (
            <MapPin className="w-5 h-5 text-farm-600 flex-shrink-0" />
          ) : (
            <PenLine className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${drawn ? 'text-farm-700 dark:text-farm-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {drawn ? `Boundary drawn · ~${drawn.hectares} ha` : 'Draw boundary on satellite map (optional)'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {drawn
                ? `${drawn.polygon.length} points · Click to redraw`
                : 'Outline your paddock on a live satellite view'}
            </p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Paddock Name *</label>
            <input className="input" placeholder="e.g. North Flat" value={form.name} onChange={(e) => setF('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Area (hectares) *</label>
            <input className="input" type="number" min="0" step="0.1" placeholder="0.0" value={form.hectares} onChange={(e) => setF('hectares', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setF('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="fallow">Fallow</option>
              <option value="harvested">Harvested</option>
              <option value="locked">Locked</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Soil Type</label>
            <select className="input" value={form.soilType} onChange={(e) => setF('soilType', e.target.value)}>
              {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Current Crop / Use</label>
            <input className="input" placeholder="e.g. Winter Wheat, Pasture, Lucerne" value={form.currentCrop} onChange={(e) => setF('currentCrop', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="Any additional notes…" value={form.notes} onChange={(e) => setF('notes', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Paddock Colour</label>
            <div className="flex gap-2 mt-1">
              {DRAW_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setF('color', hex)}
                  style={{ background: hex }}
                  className={`w-7 h-7 rounded-full transition-all ${
                    form.color === hex ? 'ring-2 ring-farm-700 ring-offset-2 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  title={hex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
