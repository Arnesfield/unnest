import { flatten } from './flatten';
import { Adjacent, Property, Row, Unnest } from './types';
import { updateSpans } from './updateSpans';

function createProperties(obj: Record<string, any>): PropertyDescriptorMap {
  const map: PropertyDescriptorMap = {};
  for (const key in obj) {
    map[key] = {
      value: obj[key],
      writable: false,
      enumerable: true,
      configurable: false
    };
  }
  return map;
}

/**
 * Flatten nested objects to table rows.
 * @param data The nested object to unnest.
 * @param property The property options to unnest.
 * @returns The table with unnested rows.
 */
export function unnest<T extends Record<string, any>>(
  data: Record<string, any> | Record<string, any>[],
  property: Property
): Unnest<T> {
  const items = Array.isArray(data) ? data : [data];
  const rows2d = items.map(item => updateSpans(flatten<T>(item, property)));
  const allRows = ([] as Row<T>[]).concat(...rows2d);

  const filter: Unnest<T>['filter'] = callback => {
    const allRows2d = rows2d.map(rows => {
      const updated = rows.map((row, index, array) => {
        const result = callback(row, index, array);
        const copy = { ...row };
        for (const key in result) {
          // ignore undefined, check for false only
          if (result[key] === false) {
            delete copy[key];
          }
        }
        return copy;
      });
      const filtered = updated.filter(row => {
        return Object.values(row).some(value => value);
      });
      return updateSpans(filtered);
    });
    return ([] as Row<T>[]).concat(...allRows2d);
  };

  const adjacent: Unnest<T>['adjacent'] = <P extends keyof T>(
    property: P,
    rowIndex: number,
    rows: Row<T>[] = allRows
  ) => {
    const length = rows.length;
    const adjacent: Adjacent<T> = {};
    for (let counter = 1; true; counter++) {
      const nextIndex = rowIndex + counter;
      const previousIndex = rowIndex - counter;
      const isNextValid = nextIndex > -1 && nextIndex < length;
      const isPreviousValid = previousIndex > -1 && previousIndex < length;
      if (!adjacent.next && isNextValid) {
        adjacent.next = rows[nextIndex][property];
      }
      if (!adjacent.previous && isPreviousValid) {
        adjacent.previous = rows[previousIndex][property];
      }
      if (
        (adjacent.next && adjacent.previous) ||
        (!isNextValid && !isPreviousValid)
      ) {
        break;
      }
    }
    return adjacent;
  };

  const value = {} as Unnest<T>;
  Object.defineProperties(
    value,
    createProperties({ rows: allRows, filter, adjacent })
  );
  return value;
}
