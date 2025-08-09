// Normalize Firestore Timestamp | Date | string | number to Date
export function toDate(value: unknown): Date {
  if (!value) return new Date(NaN);
  // Firestore Timestamp-like
  if (typeof (value as { toDate?: unknown })?.toDate === 'function') {
    try { return (value as { toDate: () => Date }).toDate(); } catch { /* noop */ }
  }
  if (value instanceof Date) return value;
  const n = typeof value === 'number' ? value : Date.parse(String(value));
  return new Date(n);
}

export function formatDate(value: unknown, opts?: Intl.DateTimeFormatOptions, locale: string = 'en-US') {
  const d = toDate(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, opts);
}

export function formatDateTime(value: unknown, opts?: Intl.DateTimeFormatOptions, locale: string = 'en-US') {
  const d = toDate(value);
  if (isNaN(d.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    ...opts,
  };
  return d.toLocaleString(locale, options);
}
