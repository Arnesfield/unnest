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

/**
 * Flatten nested object to table rows.
 * Note that row cell `span` values are not set here.
 * @param data The nested object to flatten.
 * @param props The property options to flatten.
 * @param group Identifies a collection of related rows.
 * @returns The flattened rows.
 */
export function flatten<
  D extends Record<string, any>,
  T extends Record<string, any>
>(data: D, props: Property<D>, group: string | number = 0): Row<T>[] {
  type K = keyof T;
  type Data = D[keyof D];
  const entries = Object.entries(props).filter(
    entry => entry[0] !== 'name'
  ) as [string, Property<Data>][];
  if (entries.length === 0) {
    const rows: Row<T>[] = unwrap(data).map(item => {
      const name: K = props.name ?? 'root';
      const row: Row<T> = { cells: {}, group };
      const cell: Cell<T[K]> = { data: item, group };
      row.cells[name] = cell;
      return row;
    });
    return rows;
  }
  const rows2d = entries.map(([key, property]) => {
    const items = unwrap(data?.[key]);
    const rows = ([] as Row<T>[]).concat(
      ...items.map(item => flatten<D, T>(item, property, group))
    );
    // add the data to first row
    if (rows.length === 0) {
      rows.push({ cells: {}, group });
    }
    const name: K = props.name ?? 'root';
    const cell: Cell<T[K]> = { data: data as T[K], group };
    rows[0].cells[name] = cell;
    return rows;
  });
  // merge rows2d
  // get max length of rows2d items
  const allRows: Row<T>[] = [];
  const max = Math.max(...rows2d.map(rows => rows.length));
  for (let index = 0; index < max; index++) {
    const allCells = rows2d.reduce((allCells: Row<T>['cells'][], rows) => {
      const cells: Row<T>['cells'] | undefined = rows[index]?.cells;
      cells && allCells.push(cells);
      return allCells;
    }, []);
    // merge cells
    const cells: Row<T>['cells'] = Object.assign({}, ...allCells);
    allRows.push({ cells, group });
  }
  return allRows;
}
