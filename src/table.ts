import { Row, Table, Adjacent } from './types';
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
 * Wraps the `rows` with helper functions.
 * @param rows The rows.
 */
export function createTable<T extends Record<string, any>>(
  rows: Row<T>[]
): Table<T> {
  rows = updateSpans(rows);

  const filter: Table<T>['filter'] = callback => {
    // create row copy and remove cells from row
    const updated = rows.map((row, index, array) => {
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
    return updateSpans(filtered);
  };

  const adjacent: Table<T>['adjacent'] = <P extends keyof T>(
    property: P,
    rowIndex: number
  ): Adjacent<T> => {
    const { length } = rows;
    const adjacent: Adjacent<T> = {};
    for (let counter = 1; true; counter++) {
      const nextIndex = rowIndex + counter;
      const previousIndex = rowIndex - counter;
      const isNextValid = nextIndex > -1 && nextIndex < length;
      const isPreviousValid = previousIndex > -1 && previousIndex < length;
      if (!adjacent.next && isNextValid) {
        adjacent.next = rows[nextIndex].cells[property];
      }
      if (!adjacent.previous && isPreviousValid) {
        adjacent.previous = rows[previousIndex].cells[property];
      }
      if (
        (!isNextValid && !isPreviousValid) ||
        (adjacent.next && adjacent.previous)
      ) {
        break;
      }
    }
    return adjacent;
  };

  const table = {} as Table<T>;
  Object.defineProperties(table, createProperties({ rows, filter, adjacent }));
  return table;
}
