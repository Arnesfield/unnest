import { Cell, Property, Row } from './types';

function toProperty(
  property: string,
  value: string | boolean | Property
): Property {
  return typeof value !== 'object'
    ? { name: typeof value === 'string' ? value : property }
    : value;
}

/** Flatten options. */
export interface FlattenOptions<T extends Record<string, any>> {
  /** The nested object to flatten. */
  data: Record<string, any>;
  /** The property options to flatten. */
  props: Property;
  /** Identifies a collection of related rows. */
  group?: number;
  /** The rows array to use. */
  rows?: Row<T>[];
}

/**
 * Flatten nested object to table rows.
 * @param options The flatten options.
 * @returns The flattened rows.
 */
export function flatten<T extends Record<string, any>>(
  options: FlattenOptions<T>
): Row<T>[] {
  const { data, props, group = 0, rows = [] } = options;
  if (rows.length === 0) {
    rows.push({ group, cells: {} });
  }
  // set data for current row cell
  const currentRow = rows[rows.length - 1];
  if (currentRow) {
    const cell: Cell<T> = { data: data as T };
    currentRow.cells[props.name as keyof T] = cell as any;
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
      flatten({
        rows,
        group,
        data: item,
        props: toProperty(property, nextProperty)
      });
      if (index < items.length - 1) {
        rows.push({ group, cells: {} });
      }
    }
  }
  return rows;
}
