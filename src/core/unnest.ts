import { Property, Row, Table } from '../types';
import { createProperties, flatten } from '../utils';
import { createTable } from './table';

/** The unnest object. */
export interface Unnest<Data extends Record<string, any>> {
  /**
   * Flatten nested objects to table rows.
   * @param property The property options to unnest.
   * @returns The table with unnested rows.
   */
  by<Schema extends Record<string, any>>(
    property: Property<Data>
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
    property: Property<Data>
  ): Table<Schema> => {
    const items = Array.isArray(data) ? data : [data];
    const rows2d = items.map((item, index, array) => {
      const group = typeof key === 'function' ? key(item, index, array) : index;
      return flatten<Schema, Data>(item, property, group);
    });
    const rows = ([] as Row<Schema>[]).concat(...rows2d);
    return createTable<Schema>(rows);
  };

  const unnest = {} as Unnest<Data>;
  Object.defineProperties(unnest, createProperties({ by }));
  return unnest;
}
