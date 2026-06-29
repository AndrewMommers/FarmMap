import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import toast from 'react-hot-toast';

export function FarmSwitcher() {
  const { activeFarmId, setActiveFarm } = useAppStore();
  const farms = useDataStore((s) => s.farms);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeFarm = farms.find((f) => f.id === activeFarmId) ?? farms[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (id: string) => {
    setActiveFarm(id);
    setOpen(false);
    const farm = farms.find((f) => f.id === id);
    toast.success(`Switched to ${farm?.name}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-farm-50 dark:hover:bg-gray-800 transition-colors max-w-[200px]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="w-6 h-6 rounded-lg bg-farm-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {activeFarm.name[0]}
        </div>
        <div className="flex-1 min-w-0 text-left hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-none">{activeFarm.name}</p>
          <p className="text-xs text-gray-400 truncate">{activeFarm.state} · {activeFarm.totalHectares.toLocaleString()} ha</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-farm-100 dark:border-gray-700 z-50 overflow-hidden"
          role="listbox"
          aria-label="Select farm"
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Properties</p>
          </div>
          <div className="py-1">
            {farms.map((farm) => {
              const isActive = farm.id === activeFarmId;
              return (
                <button
                  key={farm.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(farm.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-farm-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${isActive ? 'bg-farm-700 text-white' : 'bg-farm-100 text-farm-700 dark:bg-farm-900 dark:text-farm-300'}`}>
                    {farm.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{farm.name}</p>
                    <p className="text-xs text-gray-400 truncate">{farm.state} · {farm.totalHectares.toLocaleString()} ha · {farm.type}</p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-farm-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-farm-700 dark:text-farm-400 hover:bg-farm-50 dark:hover:bg-gray-800 font-medium transition-colors"
              onClick={() => { setOpen(false); navigate('/new-farm'); }}
            >
              <Plus className="w-4 h-4" /> Add New Property
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
