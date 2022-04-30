import { Cell, Row } from './types';

/**
 * Update row cell `span` values.
 * @param rows The rows to updated.
 * @returns The rows with updated cell `span` values.
 */
export function updateSpans<T extends Record<string, any>>(
  rows: Row<T>[]
): Row<T>[] {
  const childRows = Array.from(rows);
  return rows.map(row => {
    row = { ...row, cells: { ...row.cells } };
    // change cell references
    for (const entries of Object.entries(row.cells)) {
      const key: keyof T = entries[0];
      const cell: Cell<T> = entries[1];
      row.cells[key] = { ...cell } as any;
      delete row.cells[key]?.span;
    }
    const entries: [keyof T, Cell<T>][] = Object.entries(row.cells);
    childRows.shift();
    // when the next column cell exists,
    // stop incrementing span from that column
    const stopKeys: (keyof T)[] = [];
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
        if (typeof cell.span === 'undefined') {
          cell.span = 1;
        }
        cell.span++;
      }
    }
    return row;
  });
}
