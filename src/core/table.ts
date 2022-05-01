import { Cell, Row } from '../types';
import { createProperties, updateSpans } from '../utils';

/** Row filter values. */
export type RowFilter<T extends Record<string, any>> = {
  [Key in keyof T]?: boolean;
};

/** Column cells. */
export interface Column<T extends Record<string, any>> {
  /** The current cell. */
  current?: Cell<T>;
  /** The previous cell. */
  previous?: Cell<T>;
  /** The next cell. */
  next?: Cell<T>;
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
   * Get the current, previous, and next cell of property if any.
   * @param property The cell property (column).
   * @param rowIndex The row index.
   * @returns The current, previous, and next cell if any.
   */
  column<P extends keyof T>(property: P, rowIndex: number): Column<T>;
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

  const column: Table<T>['column'] = <P extends keyof T>(
    property: P,
    rowIndex: number
  ): Column<T> => {
    const rows = getRows();
    const { length } = rows;
    // allow -1 to last index + 1 (length)
    rowIndex = Math.min(length, Math.max(-1, rowIndex));
    const column: Column<T> = {};
    const set = (key: keyof Column<T>, index: number) => {
      const isValid = index > -1 && index < length;
      if (isValid && !column[key]) {
        column[key] = rows[index].cells[property];
      }
      return isValid;
    };
    set('current', rowIndex);
    for (let counter = 1; true; counter++) {
      const isPreviousValid = set('previous', rowIndex - counter);
      const isNextValid = set('next', rowIndex + counter);
      if (
        (!isNextValid && !isPreviousValid) ||
        (column.next && column.previous)
      ) {
        break;
      }
    }
    return column;
  };

  const table = {} as Table<T>;
  Object.defineProperties(
    table,
    createProperties({ rows: getRows, filter, column })
  );
  return table;
}
