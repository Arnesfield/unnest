import { Cell, Property, Row } from './types';

function toProperty(
  property: string,
  value: string | boolean | Property
): Property {
  return typeof value !== 'object'
    ? { name: typeof value === 'string' ? value : property }
    : value;
}

/**
 * Flatten nested object to table rows.
 * @param data The nested object to flatten.
 * @param props The property options to flatten.
 * @param rows The rows array to use.
 * @returns The flattened rows.
 */
export function flatten<T extends Record<string, any>>(
  data: Record<string, any>,
  props: Property,
  rows: Row<T>[] = []
): Row<T>[] {
  if (rows.length === 0) {
    rows.push({});
  }
  // set data for current row cell
  const currentRow = rows[rows.length - 1];
  if (currentRow) {
    const cell: Cell<T> = { data: data as T };
    currentRow[props.name as keyof T] = cell as any;
  }
  // flatten other properties
  for (const [property, nextProperty] of Object.entries(props)) {
    if (property === 'name') {
      continue;
    }
    const value = data[property];
    const items = Array.isArray(value)
      ? value
      : typeof value !== 'undefined' && value !== null
      ? [value]
      : [];
    for (const [index, item] of items.entries()) {
      flatten(item, toProperty(property, nextProperty), rows);
      if (index < items.length - 1) {
        rows.push({});
      }
    }
  }
  return rows;
}
