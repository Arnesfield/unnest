import { Row } from '../types';

/**
 * Render rows as a Markdown table string.
 * @param rows The rows to render.
 * @param getLabel Callback that returns the labels to display.
 * @returns The rows as Markdown table string.
 */
export function render<T extends Record<string, any>>(
  rows: Row<T>[],
  getLabel: (row: Row<T>) => { [K in keyof T]?: string }
): string {
  const pipe = (value: string[]) => `| ${value.join(' | ')} |`;

  const headers = rows.reduce((keys: (keyof T)[], row) => {
    keys.push(...Object.keys(row.cells).filter(key => !keys.includes(key)));
    return keys;
  }, []);

  const max: { [K in keyof T]?: number } = {};
  const labels: { [K in keyof T]?: string }[] = [];
  for (const row of rows) {
    // get label and max length per column
    const label = getLabel(row);
    labels.push(label);
    for (const header of headers) {
      const value = label[header];
      max[header] = Math.max(
        max[header] || 0,
        value?.length || 0,
        header.toString().length
      );
    }
  }

  const body = labels
    .map(label => {
      const cells = headers.map(header => {
        const value: string = label[header] || '';
        return value.padEnd(max[header] || 0);
      });
      return pipe(cells);
    })
    .join('\n');

  const head: string[] = [];
  const lines: string[] = [];
  for (const header of headers) {
    const heading = header.toString().padEnd(max[header] || 0);
    const line = '-'.repeat(heading.length);
    head.push(heading);
    lines.push(line);
  }

  return [pipe(head), pipe(lines), body].join('\n');
}
