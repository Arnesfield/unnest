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
  const results2d = entries.map(([key, property]) => {
    const items = unwrap(data?.[key]);
    const results = ([] as FlattenResult<T>[]).concat(
      ...items.map(item => flatten<D, T>(item, property))
    );
    // add the data to first result
    if (results.length === 0) {
      results.push({});
    }
    results[0][props.name as K] = data as T[K];
    return results;
  });
  // merge results2d
  // get max length of results2d items
  const allResults: FlattenResult<T>[] = [];
  const max = Math.max(...results2d.map(results => results.length));
  for (let index = 0; index < max; index++) {
    const items = results2d.reduce((items: FlattenResult<T>[], results) => {
      const result = results[index];
      result && items.push(result);
      return items;
    }, []);
    // merge results
    const result: FlattenResult<T> = Object.assign({}, ...items);
    allResults.push(result);
  }
  return allResults;
}
