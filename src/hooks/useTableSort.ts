import { useState, useCallback } from 'react';

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

/** Returns sort state and a toggle handler. Clicking the same key flips direction; a new key starts ascending. */
export function useTableSort(defaultKey = '', defaultDir: 'asc' | 'desc' = 'asc') {
  const [sort, setSort] = useState<SortState>({ key: defaultKey, dir: defaultDir });

  const onSort = useCallback((key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  }, []);

  return { sort, onSort };
}

/** Generic sort helper – pass typed getters for each key. */
export function applySortFn<T>(
  arr: T[],
  sort: SortState,
  getters: Partial<Record<string, (item: T) => string | number | null | undefined>>,
): T[] {
  const getter = getters[sort.key];
  if (!getter) return arr;
  return [...arr].sort((a, b) => {
    const av = getter(a) ?? '';
    const bv = getter(b) ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}
