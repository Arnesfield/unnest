import { Cell, Row } from '../types';

/**
 * Update row cell `span` values.
 * @param rows The rows to updated.
 * @returns The rows with updated cell `span` values.
 */
export function updateSpans<T extends Record<string, any>>(
  rows: Row<T>[]
): Row<T>[] {
  type K = keyof T;
  const childRows = Array.from(rows);
  return rows.map(row => {
    row = { ...row, cells: { ...row.cells } };
    // change cell references
    for (const k in row.cells) {
      const key = k as K;
      const cell: Cell<T[K]> | undefined = row.cells[key];
      row.cells[key] = cell && { ...cell };
      delete row.cells[key]?.span;
    }
    const entries: [K, Cell<T[K]>][] = Object.entries(row.cells);
    childRows.shift();
    // when the next column cell exists,
    // stop incrementing span from that column
    const stopKeys: K[] = [];
    for (const childRow of childRows) {
      // stop if not same group
      if (childRow.group !== row.group) {
        break;
      }
      for (const [key, cell] of entries) {
        if (stopKeys.includes(key)) {
          continue;
        }
        if (childRow.cells[key]) {
          stopKeys.push(key);
          continue;
        }
        if (typeof cell.span !== 'number') {
          cell.span = 1;
        }
        cell.span++;
      }
    }
    return row;
  });
}
