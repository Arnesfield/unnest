/** Get the `Record` type of type `T`. */
export type ForceRecord<T> = T extends (infer U)[]
  ? ForceRecord<Exclude<U, null | undefined>>
  : T extends Record<any, any>
  ? T
  : Record<never, never>;

/** Property value */
export type PropertyValue<T> = string | boolean | Property<ForceRecord<T>>;

/** Property options to unnest. */
export type Property<T extends Record<string, any>> = {
  /**
   * The name of the row column.
   * Defaults to the property name or `root` for the main object.
   */
  name?: string;
} & Omit<
  { [Key in keyof T]?: PropertyValue<Exclude<T[Key], null | undefined>> },
  'name'
>;

/** The table cell. */
export interface Cell<T extends Record<string, any>> {
  /** Cell data. */
  data: T;
  /** Identifies a collection of related cells. */
  group: string | number;
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

// table

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
   * @param group Filter rows by group.
   * @returns The unnested table rows.
   */
  rows(group?: string | number): Row<T>[];
  /**
   * Get the root rows.
   * @returns The root rows.
   */
  roots(): Row<T>[];
  /**
   * Get all the cells of property (column).
   * @param property The cell property (column).
   * @returns The cells of property.
   */
  column<P extends keyof T>(property: P): Cell<T[P]>[];
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
