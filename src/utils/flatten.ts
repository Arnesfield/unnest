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
  type K = keyof T;
  if (rows.length === 0) {
    rows.push({ group, cells: {} });
  }
  // set data for current row cell
  const currentRow = rows[rows.length - 1];
  if (currentRow) {
    const cell: Cell<T[K]> = { group, data: data as T[K] };
    const name: K = props.name ?? 'root';
    currentRow.cells[name] = cell;
  }
  // flatten other properties
  for (const [key, property] of Object.entries(props)) {
    if (key === 'name' || (typeof property === 'boolean' && !property)) {
      continue;
    }
    const value = data[key];
    const items = Array.isArray(value)
      ? value
      : typeof value !== 'undefined' && value !== null
      ? [value]
      : [];
    items.forEach((item, index) => {
      // get next property value
      // use key as default name if not provided
      const next: Property =
        typeof property === 'object'
          ? { ...property, name: property.name ?? key }
          : { name: typeof property === 'string' ? property : key };
      flatten(item, next, group, rows);
      if (index < items.length - 1) {
        rows.push({ group, cells: {} });
      }
    });
  }
  return rows;
}
