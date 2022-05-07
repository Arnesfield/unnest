import { Cell, CellInfo, Row, RowData, Table } from '../types';
import { createProperties } from '../utils';
import { updateSpans } from './updateSpans';

/**
 * Wraps the `rows` with helper functions.
 * @param rows The rows.
 */
export function createTable<T extends Record<string, any>>(
  rows: Row<T>[]
): Table<T> {
  let spannedRows: Row<T>[] | undefined;

  const getRows: Table<T>['rows'] = group => {
    if (!spannedRows) {
      spannedRows = updateSpans(rows);
    }
    return typeof group === 'undefined'
      ? spannedRows
      : spannedRows.filter(row => row.group === group);
  };

  const data: Table<T>['data'] = (...rows: Row<T>[]) => {
    rows = rows.length > 0 ? rows : getRows();
    return rows.map(row => {
      const item: RowData<T> = {};
      for (const key in row.cells) {
        item[key] = row.cells[key]?.data;
      }
      return item;
    });
  };

  const roots: Table<T>['roots'] = () => {
    const groups: (string | number)[] = [];
    return getRows().filter(row => {
      if (!groups.includes(row.group)) {
        groups.push(row.group);
        return true;
      }
    });
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

  const sort: Table<T>['sort'] = compare => {
    const rows = getRows();
    const sorted: Row<T>[] = [];
    for (const root of roots().sort(compare)) {
      sorted.push(...rows.filter(row => row.group === root.group));
    }
    return createTable(sorted);
  };

  const table = {} as Table<T>;
  Object.defineProperties(
    table,
    createProperties({ rows: getRows, data, roots, column, cell, filter, sort })
  );
  return table;
}
