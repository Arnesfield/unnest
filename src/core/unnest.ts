import { Cell, PropertyOptions, Row, RowData, Table } from '../types';
import { createProperties, transformProperty } from '../utils';
import { flatten } from './flatten';
import { createTable } from './table';

/**
 * Convert row data to table rows.
 * @param group Identifies a collection of related rows.
 * @param items The row data.
 * @returns The table rows.
 */
function dataToRows<T extends Record<string, any>>(
  group: Row<T>['group'],
  items: RowData<T>[]
): Row<T>[] {
  type K = keyof T;
  return items.map(item => {
    const row: Row<T> = { cells: {}, group };
    for (const [key, value] of Object.entries(item)) {
      const cell: Cell<T[K]> = { data: value, group };
      row.cells[key as K] = cell;
    }
    return row;
  });
}

/** The unnest object. */
export interface Unnest<Data extends Record<string, any>> {
  /**
   * Flatten nested objects to table rows.
   * @param property The property options to unnest.
   * @returns The table with unnested rows.
   */
  by<Schema extends Record<string, any>>(
    property: PropertyOptions<Data>
  ): Table<Schema>;
}

/**
 * Creates the method to unnest nested objects.
 * @param data The nested object to unnest.
 * @param key Returns a unique group ID for related rows. Defaults to the index of the data.
 * @returns The unnest object.
 * @example
 * const table = unnest<Item>(items).by<Schema>(property);
 */
export function unnest<Data extends Record<string, any>>(
  data: Data | Data[],
  key?: (item: Data, index: number, items: Data[]) => string
): Unnest<Data> {
  const by: Unnest<Data>['by'] = <Schema extends Record<string, any>>(
    props: PropertyOptions<Data>
  ): Table<Schema> => {
    const property = transformProperty(props);
    const items = Array.isArray(data) ? data : [data];
    const rows2d = items.map((item, index, array) => {
      const group = typeof key === 'function' ? key(item, index, array) : index;
      const result = flatten<Data, Schema>(item, property);
      return dataToRows<Schema>(group, result);
    });
    const rows = ([] as Row<Schema>[]).concat(...rows2d);
    return createTable<Schema>(rows);
  };

  const unnest = {} as Unnest<Data>;
  Object.defineProperties(unnest, createProperties({ by }));
  return unnest;
}
