import { useState, useCallback } from 'react';

/** Stats where "lower is better" — default to ascending when first clicked */
export const ASC_DEFAULT_KEYS = new Set([
  'era', 'whip', 'bb9', 'age', 'rank', 'salary', 'contract', 'projSalary', 'projYears',
]);

export interface SortState<K extends string> {
  key: K;
  dir: 'asc' | 'desc';
}

/**
 * Reusable sort-state hook.
 *
 * - Click same column → flip direction
 * - Click new column → default desc (or asc if key is in ASC_DEFAULT_KEYS)
 */
export function useSort<K extends string>(
  defaultKey: K,
  defaultDir: 'asc' | 'desc' = 'desc',
): { sort: SortState<K>; toggle: (key: K) => void } {
  const [sort, setSort] = useState<SortState<K>>({ key: defaultKey, dir: defaultDir });

  const toggle = useCallback((key: K) => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' };
      }
      return { key, dir: ASC_DEFAULT_KEYS.has(key) ? 'asc' : 'desc' };
    });
  }, []);

  return { sort, toggle };
}

/** Generic comparator that works for string | number values. */
export function compareSortValues(
  a: string | number,
  b: string | number,
  dir: 'asc' | 'desc',
): number {
  const cmp = typeof a === 'string'
    ? (a as string).localeCompare(b as string)
    : (a as number) - (b as number);
  return dir === 'desc' ? -cmp : cmp;
}
