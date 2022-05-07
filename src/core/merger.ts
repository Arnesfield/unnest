import { RowData } from '../types';
import { createProperties } from '../utils';

function filterProps<T extends Record<string, any>>(
  object: T,
  props: (string | number | symbol)[],
  exclude = false
): T[] {
  const allItems: T[] = [];
  let hasValue = false;
  const obj: T = {} as T;
  for (const prop in object) {
    if (exclude === props.includes(prop)) {
      continue;
    }
    const value = object[prop];
    if (typeof value !== 'undefined' && value !== null) {
      obj[prop] = value;
      hasValue = true;
    }
  }
  if (hasValue) {
    allItems.push(obj);
  }
  return allItems;
}

export interface Merger<T extends Record<string, any>> {
  rows(): RowData<T>[];
  merge(rows: RowData<T>[], conflictProps: (keyof T)[]): void;
}

export function createMerger<T extends Record<string, any>>(): Merger<T> {
  let didMergeConflicts = false;
  const allRows: RowData<T>[] = [];
  const allConflicts: RowData<T>[] = [];

  const rows: Merger<T>['rows'] = () => {
    // merge conflict items
    if (!didMergeConflicts) {
      didMergeConflicts = true;
      allRows.push(...allConflicts);
    }
    return allRows;
  };

  const merge: Merger<T>['merge'] = (rows, conflictProps) => {
    if (rows.length === 0) {
      return;
    }
    // use first item as basis
    const mainRow: RowData<T> = Object.assign({}, rows.shift());
    for (const row of rows) {
      // merge clean row data to mainRow
      Object.assign(mainRow, ...filterProps(row, conflictProps, true));
      // get last conflict
      const conflicts = filterProps(row, conflictProps, false);
      const lastConflict = allConflicts[allConflicts.length - 1] as
        | RowData<T>
        | undefined;
      // merge but save as new row data if it conflicts with lastConflict
      if (
        !lastConflict ||
        conflicts.some(conflict => {
          return Object.keys(conflict).some(key => key in lastConflict);
        })
      ) {
        allConflicts.push(...conflicts);
      } else {
        Object.assign(lastConflict, ...conflicts);
      }
    }
    // save result
    allRows.push(mainRow);
  };

  const merger = {} as Merger<T>;
  Object.defineProperties(merger, createProperties({ rows, merge }));
  return merger;
}
