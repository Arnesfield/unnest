import { Cell, Property, Row } from '../types';

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

/** Flatten result. */
export type FlattenResult<T extends Record<string, any>> = {
  [Key in keyof T]?: T[Key];
};

/**
 * Convert flattened results to rows.
 * @param group Identifies a collection of related rows.
 * @param results The flattened results.
 * @returns The rows.
 */
export function flatToRows<T extends Record<string, any>>(
  group: Row<T>['group'],
  results: FlattenResult<T>[]
): Row<T>[] {
  type K = keyof T;
  return results.map(item => {
    const row: Row<T> = { cells: {}, group };
    for (const [key, value] of Object.entries(item)) {
      const cell: Cell<T[K]> = { data: value, group };
      row.cells[key as K] = cell;
    }
    return row;
  });
}

function getAllKeys<T extends Record<string, any>>(items: T[]): (keyof T)[] {
  const set = new Set<string>();
  for (const item of items) {
    for (const key in item) {
      set.add(key);
    }
  }
  return Array.from(set);
}

function getItemUsingKeys<T extends Record<string, any>>(
  includeKeys: (keyof T)[] | undefined,
  excludeKeys: (keyof T)[] | undefined,
  ...items: T[]
): T[] {
  const allItems: T[] = [];
  for (const item of items) {
    let hasValue = false;
    const obj: T = {} as T;
    for (const key in item) {
      const isIncluded = !includeKeys || includeKeys.includes(key);
      const isExcluded = excludeKeys && excludeKeys.includes(key);
      if (!isIncluded || isExcluded) {
        continue;
      }
      const value = item[key];
      const isValid = typeof value !== 'undefined' && value !== null;
      if (isValid) {
        obj[key] = value;
        hasValue = true;
      }
    }
    if (hasValue) {
      allItems.push(obj);
    }
  }
  return allItems;
}

/**
 * Flatten nested object to array of objects.
 * @param data The nested object to flatten.
 * @param props The property options to flatten.
 * @returns The flattened results.
 */
export function flatten<
  D extends Record<string, any>,
  T extends Record<string, any>
>(data: D, props: Property<D>): FlattenResult<T>[] {
  type K = keyof T;
  type Data = D[keyof D];
  const entries = Object.entries(props).filter(
    entry => entry[0] !== 'name'
  ) as [string, Property<Data>][];
  if (entries.length === 0) {
    return unwrap(data).map(item => {
      return { [props.name]: item } as FlattenResult<T>;
    });
  }

  interface KeyedItems {
    keys: K[];
    results: FlattenResult<T>[];
  }
  let max = 0;
  const keyedItems: KeyedItems[] = entries.map(([key, property]) => {
    const items = unwrap(data?.[key]);
    const results = ([] as FlattenResult<T>[]).concat(
      ...items.map(item => flatten<D, T>(item, property))
    );
    // add the data to first result
    if (results.length === 0) {
      results.push({});
    }
    results[0][props.name as K] = data as T[K];
    const keys = getAllKeys(results);
    max = results.length > max ? results.length : max;
    return { keys, results };
  });

  const allResults: FlattenResult<T>[] = [];
  const allConflictItems: FlattenResult<T>[] = [];

  interface KeyedItem {
    keys: K[];
    result: FlattenResult<T>;
  }
  for (let index = 0; index < max; index++) {
    const propertyItemsToMerge: KeyedItem[] = [];
    for (const { keys, results } of keyedItems) {
      const result = results[index];
      result && propertyItemsToMerge.push({ keys, result });
    }
    // get all duplicate keys
    const keySet = new Set<K>();
    const duplicateSet = new Set<K>();
    for (const { keys } of propertyItemsToMerge) {
      for (const key of keys) {
        // skip current property
        if (props.name !== key && keySet.has(key)) {
          duplicateSet.add(key);
        }
        keySet.add(key);
      }
    }
    // use first item as basis
    const firstItem = propertyItemsToMerge.shift();
    const finalResult: FlattenResult<T> = Object.assign(
      {},
      firstItem?.result || {}
    );
    const conflictKeys = Array.from(duplicateSet);
    // merge
    for (const { result } of propertyItemsToMerge) {
      const validItems = getItemUsingKeys<FlattenResult<T>>(
        undefined,
        conflictKeys,
        result
      );
      Object.assign(finalResult, ...validItems);
      // check last conflict
      const lastConflict = allConflictItems[allConflictItems.length - 1] as
        | FlattenResult<T>
        | undefined;
      const conflictItems = getItemUsingKeys<FlattenResult<T>>(
        conflictKeys,
        undefined,
        result
      );
      const conflictItemKeys = getAllKeys(conflictItems);
      // new row or merge
      if (!lastConflict || conflictItemKeys.some(key => key in lastConflict)) {
        allConflictItems.push(...conflictItems);
      } else {
        Object.assign(lastConflict, ...conflictItems);
      }
    }
    // save result
    allResults.push(finalResult);
  }
  // merge conflict items
  allResults.push(...allConflictItems);
  return allResults;
}
