import { flatten } from './flatten';
import { createTable } from './table';
import { Property, Row, Table } from './types';

/**
 * Flattens nested objects to table rows.
 * @param data The nested object to unnest.
 * @param property The property options to unnest.
 * @returns The table with unnested rows.
 */
export function unnest<T extends Record<string, any>>(
  data: Record<string, any> | Record<string, any>[],
  property: Property
): Table<T> {
  const items = Array.isArray(data) ? data : [data];
  const rows2d = items.map((data, group) => {
    return flatten<T>({ data, props: property, group });
  });
  const rows = ([] as Row<T>[]).concat(...rows2d);
  return createTable<T>(rows);
}

export default unnest;
