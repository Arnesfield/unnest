import { flatten } from './flatten';
import { createTable } from './table';
import { Property, Row, Table } from './types';
import { createProperties } from './utils/createProperties';

/** The unnest object. */
export interface Unnest<Schema extends Record<string, any>> {
  /**
   * Flattens nested objects to table rows.
   * @param data The nested object to unnest.
   * @param property The property options to unnest.
   * @param key Returns a unique group ID for related rows. Defaults to the index of the data.
   * @returns The table with unnested rows.
   */
  data<Data extends Record<string, any>>(
    data: Data | Data[],
    property: Property,
    key?: (item: Data, index: number, items: Data[]) => string | number
  ): Table<Schema>;
}

/**
 * Creates the method to unnest nested objects.
 * @returns The unnest object.
 * @example
 * const table = unnest<TableSchema>().data<ItemType>(items, property);
 */
export function unnest<Schema extends Record<string, any>>(): Unnest<Schema> {
  const data: Unnest<Schema>['data'] = <Data extends Record<string, any>>(
    data: Data | Data[],
    property: Property,
    key?: (item: Data, index: number, items: Data[]) => string
  ): Table<Schema> => {
    const items = Array.isArray(data) ? data : [data];
    const rows2d = items.map((item, index, array) => {
      const group = typeof key === 'function' ? key(item, index, array) : index;
      return flatten<Schema>({ data: item, property, group });
    });
    const rows = ([] as Row<Schema>[]).concat(...rows2d);
    return createTable<Schema>(rows);
  };

  const unnest = {} as Unnest<Schema>;
  Object.defineProperties(unnest, createProperties({ data }));
  return unnest;
}

export default unnest;
