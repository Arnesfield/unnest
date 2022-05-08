import { Cell, Row, RowData } from '../common.types';

/** Row filter values. */
export type RowFilter<T extends Record<string, any>> = {
  [K in keyof T]?: boolean;
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
   * @param group Filter rows by group.
   * @returns The unnested table rows.
   */
  rows(group?: string | number): Row<T>[];
  /**
   * Get the row data.
   * @returns The row data.
   */
  data(): RowData<T>[];
  /**
   * Transform table rows to row data.
   * @param rows The rows to convert.
   * @returns The row data.
   */
  data(...rows: Row<T>[]): RowData<T>[];
  /**
   * Get the root rows (the main object/s or the first rows per group).
   * @returns The root rows.
   */
  roots(): Row<T>[];
  /**
   * Get all the cells of property (column).
   * @param property The cell property (column).
   * @param group Filter cells by group.
   * @returns The cells of property.
   */
  column<P extends keyof T>(property: P, group?: string | number): Cell<T[P]>[];
  /**
   * Get the cell info (current, previous, and next cells) at row index if any.
   * @param property The cell property (column).
   * @param rowIndex The row index.
   * @returns The cell info.
   */
  cell<P extends keyof T>(property: P, rowIndex: number): CellInfo<T[P]>;
  /**
   * Filter rows.
   * @param callback The filter callback.
   * @returns The table with the filtered rows.
   */
  filter(
    callback: (row: Row<T>, index: number, rows: Row<T>[]) => RowFilter<T>
  ): Table<T>;
  /**
   * Sort rows by root rows.
   * @param compare The compare callback.
   * @returns The table with the sorted rows.
   */
  sort(compare: (a: Row<T>, b: Row<T>) => number): Table<T>;
}
