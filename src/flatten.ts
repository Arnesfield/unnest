import { Cell, Property, Row } from './types';

function toProperty(
  property: string,
  value: string | boolean | Property
): Property {
  return typeof value !== 'object'
    ? { $name: typeof value === 'string' ? value : property }
    : value;
}

function flattenData<T extends Record<string, any>>(
  rows: Row<T>[],
  data: Record<string, any>,
  propertyMap: Property
): void {
  // set data for current row cell
  const currentRow = rows[rows.length - 1];
  if (currentRow) {
    const cell: Cell<T> = { data: data as T };
    currentRow[propertyMap.$name as keyof T] = cell as any;
  }
  // flatten other properties
  for (const [property, nextProperty] of Object.entries(propertyMap)) {
    if (property === '$name') {
      continue;
    }
    const value = data[property];
    const items = Array.isArray(value)
      ? value
      : typeof value !== 'undefined' && value !== null
      ? [value]
      : [];
    for (const [index, item] of items.entries()) {
      flattenData(rows, item, toProperty(property, nextProperty));
      if (index < items.length - 1) {
        rows.push({});
      }
    }
  }
}

/**
 * Flatten nested object to table rows.
 * @param data The nested object to flatten.
 * @param property The property options to flatten.
 * @returns The flattened rows.
 */
export function flatten<T extends Record<string, any>>(
  data: Record<string, any>,
  property: Property
): Row<T>[] {
  const rows: Row<T>[] = [{}];
  flattenData(rows, data, property);
  return rows;
}
