// ─── CSV Export Utility ───────────────────────────────────────
// Generic client-side CSV builder — no external library needed.
// Usage: exportToCSV([{ name: 'Alice', age: 30 }], 'users')

/**
 * Converts an array of objects to a CSV string and triggers download.
 * @param data - Array of flat objects (nested values are JSON-stringified)
 * @param filename - Output filename without .csv extension
 * @param columns - Optional subset of keys to include (and their labels)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (!data.length) {
    console.warn('[CSV Export] No data to export');
    return;
  }

  let headers: string[];
  let keys: (keyof T)[];

  if (columns) {
    headers = columns.map((c) => c.label);
    keys = columns.map((c) => c.key);
  } else {
    keys = Object.keys(data[0]) as (keyof T)[];
    headers = keys as string[];
  }

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...data.map((row) => keys.map((k) => escapeCell(row[k])).join(',')),
  ];

  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
