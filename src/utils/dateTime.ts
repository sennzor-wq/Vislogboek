/**
 * Centrale kalenderdatum- en tijdregels voor de Nederlandse app-context.
 *
 * ISO-tijdstempels blijven absolute UTC-momenten. Kalenderdagen, maanden en
 * tijdvakken worden expliciet geïnterpreteerd in Europe/Amsterdam.
 */
export const APP_TIME_ZONE = 'Europe/Amsterdam';

const dateKeyFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23',
});

function parseValidDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Geeft YYYY-MM-DD in Europe/Amsterdam; date-only strings blijven kalenderdatums. */
export function getAmsterdamDateKey(value: Date | string): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
  }
  const date = parseValidDate(value);
  return date ? dateKeyFormatter.format(date) : null;
}

/** Geeft het lokale uur (0–23) in Europe/Amsterdam voor een absoluut tijdstip. */
export function getAmsterdamHour(value: Date | string): number | null {
  const date = parseValidDate(value);
  if (!date) return null;
  const hour = Number(hourFormatter.format(date));
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

/** Geeft de kalendermaand (1–12) in Europe/Amsterdam of uit een date-only string. */
export function getAmsterdamMonth(value: Date | string): number | null {
  const dateKey = getAmsterdamDateKey(value);
  if (!dateKey) return null;
  const month = Number(dateKey.slice(5, 7));
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
}

/** Verschuift een kalenderdatum zonder afhankelijk te zijn van UTC-offset of DST. */
export function addCalendarDays(dateKey: string, days: number): string | null {
  if (!Number.isInteger(days) || !getAmsterdamDateKey(dateKey)) return null;
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
