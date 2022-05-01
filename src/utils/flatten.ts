import { Cell, Property, Row } from '../types';

/**
 * Flatten nested object to table rows.
 * Note that row cell `span` values are not set here.
 * @param data The nested object to flatten.
 * @param props The property options to flatten.
 * @param group Identifies a collection of related rows.
 * @param rows The rows array to use.
 * @returns The flattened rows.
 */
export function flatten<T extends Record<string, any>>(
  data: Record<string, any>,
  props: Property,
  group: string | number = 0,
  rows: Row<T>[] = []
): Row<T>[] {
  if (rows.length === 0) {
    rows.push({ group, cells: {} });
  }
  // set data for current row cell
  const currentRow = rows[rows.length - 1];
  if (currentRow) {
    const cell: Cell<T> = { group, data: data as T };
    currentRow.cells[props.name as keyof T] = cell as any;
  }
  // flatten other properties
  for (const [key, property] of Object.entries(props)) {
    if (key === 'name') {
      continue;
    }
    const value = data[key];
    const items = Array.isArray(value)
      ? value
      : typeof value !== 'undefined' && value !== null
      ? [value]
      : [];
    for (const [index, item] of items.entries()) {
      // get next property value
      const next =
        typeof property !== 'object'
          ? { name: typeof property === 'string' ? property : key }
          : property;
      flatten(item, next, group, rows);
      if (index < items.length - 1) {
        rows.push({ group, cells: {} });
      }
    }
  }
  return rows;
}
