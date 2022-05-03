import { Row } from '../types';

/** Render labels. */
export type RenderLabel<T extends Record<string, any>> = {
  [K in keyof T]?: string | number | boolean;
};

/** Get label callback. */
export type GetLabelCallback<T extends Record<string, any>> = (
  row: Row<T>
) => RenderLabel<T>;

/**
 * Render rows as a Markdown table string.
 * @param rows The rows to render.
 * @param getLabel Callback that returns the labels to display.
 * @returns The rows as Markdown table string.
 */
export function render<T extends Record<string, any>>(
  rows: Row<T>[],
  getLabel: GetLabelCallback<T>
): string;

/**
 * Render rows as a Markdown table string.
 * @param rows The rows to render.
 * @param columns The default columns to display.
 * @param getLabel Callback that returns the labels to display.
 * @returns The rows as Markdown table string.
 */
export function render<T extends Record<string, any>>(
  rows: Row<T>[],
  columns: (keyof T)[],
  getLabel: GetLabelCallback<T>
): string;

export function render<T extends Record<string, any>>(
  rows: Row<T>[],
  columns: (keyof T)[] | GetLabelCallback<T>,
  getLabel: GetLabelCallback<T> = () => ({})
): string {
  if (typeof columns === 'function') {
    getLabel = columns;
    columns = [];
  }
  const pipe = (value: string[]) => `| ${value.join(' | ')} |`;

  const headers = rows.reduce((keys: (keyof T)[], row) => {
    keys.push(...Object.keys(row.cells).filter(key => !keys.includes(key)));
    return keys;
  }, columns);

  const max: { [K in keyof T]?: number } = {};
  const labels: RenderLabel<T>[] = [];
  for (const row of rows) {
    // get label and max length per column
    const label = getLabel(row);
    labels.push(label);
    for (const header of headers) {
      const value = label[header];
      max[header] = Math.max(
        max[header] || 0,
        value?.toString().length || 0,
        header.toString().length
      );
    }
  }

  const body = labels
    .map(label => {
      const cells = headers.map(header => {
        // align right for numbers
        const pad: number = max[header] || 0;
        const value: string | number | boolean | undefined = label[header];
        const method = typeof value === 'number' ? 'padStart' : 'padEnd';
        const str = (value ?? '').toString();
        return str[method](pad);
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
