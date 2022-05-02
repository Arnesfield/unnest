/** Property options to unnest. */
export type Property = {
  /**
   * The name of the row column.
   * Defaults to the property name or `root` for the main object.
   */
  name?: string;
} & {
  /** Property options. */
  [key: string]: string | boolean | Property;
};

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
