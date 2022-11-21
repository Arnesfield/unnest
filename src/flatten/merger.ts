import { RowData } from '../common.types';
import { defineProperties } from '../utils/defineProperties';

function filterProps<T extends Record<string, any>>(
  object: T,
  props: (string | number | symbol)[],
  exclude = false
): T[] {
  let hasValue = false;
  const obj = {} as T;
  const allItems: T[] = [];
  for (const prop in object) {
    const value = object[prop];
    if (
      exclude !== props.includes(prop) &&
      typeof value !== 'undefined' &&
      value !== null
    ) {
      hasValue = true;
      obj[prop] = value;
    }
  }
  if (hasValue) {
    allItems.push(obj);
  }
  return allItems;
}

export interface Merger<T extends Record<string, any>> {
  conflicts(): RowData<T>[];
  merge(rows: RowData<T>[], conflictProps: (keyof T)[]): RowData<T> | undefined;
}

export function createMerger<T extends Record<string, any>>(): Merger<T> {
  const allConflicts: RowData<T>[] = [];

  const conflicts: Merger<T>['conflicts'] = () => allConflicts;

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
    return mainRow;
  };

  const merger = {} as Merger<T>;
  defineProperties(merger, { merge, conflicts });
  return merger;
}
