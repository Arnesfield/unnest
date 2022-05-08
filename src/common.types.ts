/** Property. */
export type Property<T extends Record<string, any>> = {
  /** The name of the row column. */
  name: string;
} & Omit<{ [K in keyof T]?: Property<T[K]> }, 'name'>;

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
    [K in keyof T]?: Cell<T[K]>;
  };
}

/** The row data. */
export type RowData<T extends Record<string, any>> = Partial<T>;
