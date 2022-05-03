import { Cell, Property, PropertyValue, Row } from '../types';

/**
 * Flatten nested object to table rows.
 * Note that row cell `span` values are not set here.
 * @param data The nested object to flatten.
 * @param props The property options to flatten.
 * @param group Identifies a collection of related rows.
 * @param rows The rows array to use.
 * @returns The flattened rows.
 */
export function flatten<
  D extends Record<string, any>,
  T extends Record<string, any>
>(
  data: D,
  props: Property<D>,
  group: string | number = 0,
  rows: Row<T>[] = []
): Row<T>[] {
  type K = keyof T;
  type Data = D[keyof D];
  if (rows.length === 0) {
    rows.push({ cells: {}, group });
  }
  // set data for current row cell
  const currentRow = rows[rows.length - 1];
  if (currentRow) {
    const cell: Cell<T[K]> = { data: data as T[K], group };
    const name: K = props.name ?? 'root';
    currentRow.cells[name] = cell;
  }
  // flatten other properties
  const entries = Object.entries(props) as [string, PropertyValue<Data>][];
  for (const [key, property] of entries) {
    if (key === 'name' || (typeof property === 'boolean' && !property)) {
      continue;
    }
    const value = data?.[key];
    const items = Array.isArray(value)
      ? value
      : typeof value !== 'undefined' && value !== null
      ? [value]
      : [];
    items.forEach((item, index) => {
      // get next property value
      // use key as default name if not provided
      const next: Property<Data> =
        typeof property === 'object'
          ? { ...property, name: property.name ?? key }
          : ({
              name: typeof property === 'string' ? property : key
            } as Property<Data>);
      flatten(item, next, group, rows);
      if (index < items.length - 1) {
        rows.push({ cells: {}, group });
      }
    });
  }
  return rows;
}
