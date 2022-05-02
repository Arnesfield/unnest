import { Cell, Row } from '../types';
import { createProperties, updateSpans } from '../utils';

/** Row filter values. */
export type RowFilter<T extends Record<string, any>> = {
  [Key in keyof T]?: boolean;
};

/** Cell info. */
export interface CellInfo<T extends Record<string, any>> {
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
   * Get all the cells of the property (column).
   * @param property The cell property (column).
   */
  column<P extends keyof T>(property: P): Cell<T[P]>[];
  /**
   * Filter rows.
   * @param callback The filter callback.
   * @returns The filtered rows.
   */
  filter(
    callback: (row: Row<T>, index: number, rows: Row<T>[]) => RowFilter<T>
  ): Table<T>;
  /**
   * Get the cell info (current, previous, and next cell) at row index if any.
   * @param property The cell property (column).
   * @param rowIndex The row index.
   * @returns The cell info.
   */
  cell<P extends keyof T>(property: P, rowIndex: number): CellInfo<T[P]>;
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

  const column: Table<T>['column'] = <P extends keyof T>(property: P) => {
    return getRows().reduce((cells: Cell<T[P]>[], row) => {
      const cell = row.cells[property];
      if (cell) {
        cells.push(cell);
      }
      return cells;
    }, []);
  };

  const filter: Table<T>['filter'] = callback => {
    // create row copy and remove cells from row
    const filtered: Row<T>[] = [];
    getRows().forEach((row, index, array) => {
      const result = callback(row, index, array);
      const newRow = { ...row, cells: { ...row.cells } };
      for (const key in result) {
        if (!result[key]) {
          delete newRow.cells[key];
        }
      }
      if (Object.values(newRow.cells).some(cell => cell)) {
        filtered.push(newRow);
      }
    });
    return createTable(filtered);
  };

  const cell: Table<T>['cell'] = <P extends keyof T>(
    property: P,
    rowIndex: number
  ): CellInfo<T[P]> => {
    const rows = getRows();
    const { length } = rows;
    const info: CellInfo<T[P]> = {};
    const set = (key: keyof CellInfo<T>, index: number) => {
      const isValid = index > -1 && index < length;
      if (isValid && !info[key]) {
        info[key] = rows[index].cells[property];
      }
      return isValid;
    };
    // allow -1 to last index + 1 (length)
    rowIndex = Math.min(length, Math.max(-1, rowIndex));
    set('current', rowIndex);
    for (let counter = 1; true; counter++) {
      const isPreviousValid = set('previous', rowIndex - counter);
      const isNextValid = set('next', rowIndex + counter);
      if ((!isNextValid && !isPreviousValid) || (info.next && info.previous)) {
        break;
      }
    }
    return info;
  };

  const table = {} as Table<T>;
  Object.defineProperties(
    table,
    createProperties({ rows: getRows, column, filter, cell })
  );
  return table;
}
