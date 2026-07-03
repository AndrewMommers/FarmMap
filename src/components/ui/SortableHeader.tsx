import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortState } from '../../hooks/useTableSort';

interface Props {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({ label, sortKey, sort, onSort, className = '' }: Props) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`table-header cursor-pointer select-none group hover:text-farm-700 dark:hover:text-farm-300 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={active ? 'text-farm-600 dark:text-farm-400' : 'text-gray-300 group-hover:text-gray-400 transition-colors'}>
          {active && sort.dir === 'asc'  ? <ArrowUp    className="w-3 h-3" /> :
           active && sort.dir === 'desc' ? <ArrowDown   className="w-3 h-3" /> :
                                           <ArrowUpDown className="w-3 h-3" />}
        </span>
      </span>
    </th>
  );
}
