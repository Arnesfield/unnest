/** Get the `Record` type of type `T`. */
export type ForceRecord<T> = T extends Array<infer U>
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
} & Omit<{ [Key in keyof T]?: PropertyValue<T[Key]> }, 'name'>;

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
