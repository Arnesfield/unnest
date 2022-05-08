import { Property, RowData } from '../common.types';
import { createMerger } from './merger';

/**
 * Recursive wnwrap of `value` array.
 * @param value The value to unwrap.
 * @returns The array of items unwrapped.
 */
function unwrap<T = any>(value: any): T[] {
  return Array.isArray(value)
    ? ([] as any[]).concat(...value.map(item => unwrap(item)))
    : typeof value !== 'undefined' && value !== null
    ? [value]
    : [];
}

interface PropertyItem<T extends Record<string, any>> {
  props: (keyof T)[];
  rows: RowData<T>[];
}

function getRowsToMerge<T extends Record<string, any>>(
  index: number,
  propertyName: keyof T,
  propertyItems: PropertyItem<T>[]
): { rows: RowData<T>[]; conflictProps: (keyof T)[] } {
  // get all conflict props
  const rows: RowData<T>[] = [];
  const propSet = new Set<keyof T>();
  const conflictSet = new Set<keyof T>();
  for (const item of propertyItems) {
    const row = item.rows[index] as RowData<T> | undefined;
    if (!row) {
      continue;
    }
    rows.push(row);
    // get conflict props, skip current property
    for (const prop of item.props) {
      if (propertyName !== prop && propSet.has(prop)) {
        conflictSet.add(prop);
      }
      propSet.add(prop);
    }
  }
  return { rows, conflictProps: Array.from(conflictSet) };
}

/**
 * Flatten nested object to row data items.
 * @param data The nested object to flatten.
 * @param property The property options to flatten.
 * @returns The row data items.
 */
export function flatten<
  D extends Record<string, any>,
  T extends Record<string, any>
>(data: D, property: Property<D>): RowData<T>[] {
  type K = keyof T;
  type Data = D[keyof D];
  const entries = Object.entries(property).filter(
    entry => entry[0] !== 'name'
  ) as [string, Property<Data>][];
  if (entries.length === 0) {
    return unwrap(data).map(item => {
      return { [property.name]: item } as RowData<T>;
    });
  }

  const propertyItems: PropertyItem<T>[] = entries.map(entry => {
    const [key, nextProperty] = entry;
    const items = unwrap(data?.[key]);
    const rows = ([] as RowData<T>[]).concat(
      ...items.map(item => flatten<D, T>(item, nextProperty))
    );
    // add the data to first result
    if (rows.length === 0) {
      rows.push({});
    }
    rows[0][property.name as K] = data as T[K];
    // get keys
    const set = new Set<string>();
    for (const row of rows) {
      for (const key in row) {
        set.add(key);
      }
    }
    return { rows, props: Array.from(set) };
  });

  const allRows: RowData<T>[] = [];
  const merger = createMerger<RowData<T>>();
  for (let index = 0; true; index++) {
    const { rows, conflictProps } = getRowsToMerge(
      index,
      property.name,
      propertyItems
    );
    // stop loop if there are no more items
    if (rows.length === 0) {
      break;
    }
    const mergedRow = merger.merge(rows, conflictProps);
    if (mergedRow) {
      allRows.push(mergedRow);
    }
  }
  // save merge conflicts
  allRows.push(...merger.conflicts());
  return allRows;
}
