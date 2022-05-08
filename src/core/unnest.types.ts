import { Table } from '../table';

/** Get the `Record` type of type `T`. */
export type ForceRecord<T> = T extends (infer U)[]
  ? ForceRecord<Exclude<U, null | undefined>>
  : T extends Record<any, any>
  ? T
  : Record<never, never>;

/** Property value */
export type PropertyValue<T> =
  | string
  | boolean
  | PropertyOptions<ForceRecord<T>>;

/** Property options to unnest. */
export type PropertyOptions<T extends Record<string, any>> = {
  /**
   * The name of the row column.
   * Defaults to the property name or `root` for the main object.
   */
  name?: string;
} & Omit<
  { [K in keyof T]?: PropertyValue<Exclude<T[K], null | undefined>> },
  'name'
>;

/** The unnest object. */
export interface Unnest<Data extends Record<string, any>> {
  /**
   * Flatten nested objects to table rows.
   * @param property The property options to unnest.
   * @returns The table with unnested rows.
   */
  by<Schema extends Record<string, any>>(
    property: PropertyOptions<Data>
  ): Table<Schema>;
}
