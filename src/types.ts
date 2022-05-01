/** Property options to unnest. */
export interface Property {
  /** The name of the row column. */
  name: string;
  /** Property options. */
  [key: string]: string | boolean | Property;
}

/** The table cell. */
export interface Cell<T extends Record<string, any>> {
  /** Cell data. */
  data: T;
  /** The row `span` value. */
  span?: number;
}

/** The table row. */
export interface Row<T extends Record<string, any>> {
  /** Identifies a collection of related rows. */
  group: string | number;
  /** The row cells. */
  cells: {
    [Key in keyof T]?: Cell<T[Key]>;
  };
}

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

/**
 * Table with the unnested rows and helper methods.
 */
export interface Table<T extends Record<string, any>> {
  /** The unnested table rows. */
  rows(): Row<T>[];
  /**
   * Filter rows.
   * @param callback The filter callback.
   * @returns The filtered rows.
   */
  filter(
    callback: (row: Row<T>, index: number, rows: Row<T>[]) => RowFilter<T>
  ): Row<T>[];
  /**
   * Get the next and previous cell of property.
   * @param property The cell property.
   * @param rowIndex The row index.
   */
  adjacent<P extends keyof T>(property: P, rowIndex: number): Adjacent<T>;
}
