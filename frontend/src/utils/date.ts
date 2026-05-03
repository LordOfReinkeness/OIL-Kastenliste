const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

/** Converts separate local date + time inputs to a UTC ISO string. */
export function toUTC(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes]   = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

/** "Mo. 05.05.2026, 13:15 Uhr" */
export function formatDateTime(d: Date | string): string {
  const date = toDate(d);
  return date.toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: tz,
  }) + ', ' + date.toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: tz,
  }) + ' Uhr';
}

/** "Montag, 5. Mai 2026, 13:15 Uhr" */
export function formatDateTimeLong(d: Date | string): string {
  const date = toDate(d);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz,
  }) + ', ' + date.toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: tz,
  }) + ' Uhr';
}

/** "05.05." — for compact table headers */
export function formatDateShort(d: Date | string): string {
  return toDate(d).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', timeZone: tz,
  });
}

/** "5. Mai 2026" — for history lists */
export function formatDateMedium(d: Date | string): string {
  return toDate(d).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: tz,
  });
}
