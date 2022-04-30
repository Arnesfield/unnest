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
    row = { ...row };
    // change cell references
    for (const [key, cell] of Object.entries(row)) {
      (row as Record<string, any>)[key] = { ...cell };
      delete row[key]?.span;
    }
    const entries: [string, Cell<T>][] = Object.entries(row);
    childRows.shift();
    // when the next column cell exists,
    // stop incrementing span from that column
    const stopKeys: string[] = [];
    for (const childRow of childRows) {
      for (const [key, cell] of entries) {
        if (stopKeys.includes(key)) {
          continue;
        }
        if (childRow[key]) {
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
