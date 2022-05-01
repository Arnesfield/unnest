import { Cell, Row } from '../types';
import { createProperties, updateSpans } from '../utils';

/** Row filter values. */
export type RowFilter<T extends Record<string, any>> = {
  [Key in keyof T]?: boolean;
};

/** Adjacent cells. */
export interface Adjacent<T extends Record<string, any>> {
  /** The next cell. */
  next?: Cell<T>;
  /** The previous cell. */
  previous?: Cell<T>;
}

/** Table with the unnested rows and helper methods. */
export interface Table<T extends Record<string, any>> {
  /**
   * Get the rows.
   * @returns The unnested table rows.
   */
  rows(): Row<T>[];
  /**
   * Filter rows.
   * @param callback The filter callback.
   * @returns The filtered rows.
   */
  filter(
    callback: (row: Row<T>, index: number, rows: Row<T>[]) => RowFilter<T>
  ): Table<T>;
  /**
   * Get the next and previous cell of property.
   * @param property The cell property.
   * @param rowIndex The row index.
   */
  adjacent<P extends keyof T>(property: P, rowIndex: number): Adjacent<T>;
}

/**
 * Wraps the `rows` with helper functions.
 * @param rows The rows.
 */
export function createTable<T extends Record<string, any>>(
  rows: Row<T>[]
): Table<T> {
  let spannedRows: Row<T>[] | undefined;

  const getRows: Table<T>['rows'] = () => {
    if (!spannedRows) {
      spannedRows = updateSpans(rows);
    }
    return spannedRows;
  };

  const filter: Table<T>['filter'] = callback => {
    // create row copy and remove cells from row
    const updated = getRows().map((row, index, array) => {
      const result = callback(row, index, array);
      const newRow = { ...row, cells: { ...row.cells } };
      for (const key in result) {
        if (!result[key]) {
          delete newRow.cells[key];
        }
      }
      return newRow;
    });
    const filtered = updated.filter(row => {
      return Object.values(row.cells).some(value => value);
    });
    return createTable(filtered);
  };

  const adjacent: Table<T>['adjacent'] = <P extends keyof T>(
    property: P,
    rowIndex: number
  ): Adjacent<T> => {
    const rows = getRows();
    const { length } = rows;
    const adjacent: Adjacent<T> = {};
    for (let counter = 1; true; counter++) {
      const nextIndex = rowIndex + counter;
      const previousIndex = rowIndex - counter;
      const isNextValid = nextIndex > -1 && nextIndex < length;
      const isPreviousValid = previousIndex > -1 && previousIndex < length;
      if (!adjacent.next && isNextValid) {
        adjacent.next = rows[nextIndex].cells[property];
      }
      if (!adjacent.previous && isPreviousValid) {
        adjacent.previous = rows[previousIndex].cells[property];
      }
      if (
        (!isNextValid && !isPreviousValid) ||
        (adjacent.next && adjacent.previous)
      ) {
        break;
      }
    }
    return adjacent;
  };

  const table = {} as Table<T>;
  Object.defineProperties(
    table,
    createProperties({ rows: getRows, filter, adjacent })
  );
  return table;
}
