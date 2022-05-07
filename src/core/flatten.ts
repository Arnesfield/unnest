import { Cell, Property, Row, RowData } from '../types';

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

/**
 * Convert row data to table rows.
 * @param group Identifies a collection of related rows.
 * @param items The row data.
 * @returns The table rows.
 */
export function flatToRows<T extends Record<string, any>>(
  group: Row<T>['group'],
  items: RowData<T>[]
): Row<T>[] {
  type K = keyof T;
  return items.map(item => {
    const row: Row<T> = { cells: {}, group };
    for (const [key, value] of Object.entries(item)) {
      const cell: Cell<T[K]> = { data: value, group };
      row.cells[key as K] = cell;
    }
    return row;
  });
}

function getProps<T extends Record<string, any>>(items: T[]): (keyof T)[] {
  const set = new Set<string>();
  for (const item of items) {
    for (const key in item) {
      set.add(key);
    }
  }
  return Array.from(set);
}

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

interface Merger<T extends Record<string, any>> {
  rows: () => RowData<T>[];
  merge: (rows: RowData<T>[], conflictProps: (keyof T)[]) => void;
}

function createMerger<T extends Record<string, any>>(): Merger<T> {
  let didMergeConflicts = false;
  const allRows: RowData<T>[] = [];
  const allConflicts: RowData<T>[] = [];

  const rows = () => {
    if (!didMergeConflicts) {
      didMergeConflicts = true;
      // merge conflict items
      allRows.push(...allConflicts);
    }
    return allRows;
  };

  const merge = (rows: RowData<T>[], conflictProps: (keyof T)[]) => {
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

  return { rows, merge };
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
    return { rows, props: getProps(rows) };
  });

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
    merger.merge(rows, conflictProps);
  }
  return merger.rows();
}
