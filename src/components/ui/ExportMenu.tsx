import { useState, useRef, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';

interface Props {
  onCSV: () => void;
  onPDF: () => void;
  className?: string;
}

export function ExportMenu({ onCSV, onPDF, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
        <span className="text-[10px] opacity-50">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[148px]">
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-farm-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-green-600 font-bold text-xs w-5 text-center">CSV</span>
            Spreadsheet
          </button>
          <button
            onClick={() => { onPDF(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-farm-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
            PDF Report
          </button>
        </div>
      )}
    </div>
  );
}
