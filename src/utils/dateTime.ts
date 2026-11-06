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

const localDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function getAmsterdamWallParts(date: Date): number[] {
  const parts = localDateTimeFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return [value('year'), value('month'), value('day'), value('hour'), value('minute'), value('second')];
}

/**
 * Legacy imports may contain timezone-less ISO-like date-times. Interpret those
 * as Amsterdam wall time, not in whichever timezone the current device happens
 * to use. For the repeated autumn hour, choose the earlier instant; nonexistent
 * spring-forward wall times are rejected instead of silently shifted.
 */
function parseAmsterdamLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) return null;

  const [year, month, day, hour, minute, second, fraction] = match.slice(1).map((part, index) =>
    index === 6 ? Number((part || '0').padEnd(3, '0')) : Number(part || '0')
  );
  const wallUtc = Date.UTC(year, month - 1, day, hour, minute, second, fraction);
  const check = new Date(wallUtc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month ||
      check.getUTCDate() !== day || check.getUTCHours() !== hour ||
      check.getUTCMinutes() !== minute || check.getUTCSeconds() !== second) return null;

  const offsets = new Set<number>();
  for (const hoursAround of [-36, -12, 0, 12, 36]) {
    const sample = new Date(wallUtc + hoursAround * 60 * 60 * 1000);
    const [localYear, localMonth, localDay, localHour, localMinute, localSecond] = getAmsterdamWallParts(sample);
    const representedAsUtc = Date.UTC(localYear, localMonth - 1, localDay, localHour, localMinute, localSecond);
    offsets.add(Math.round((representedAsUtc - sample.getTime()) / 60000));
  }

  const candidates: Date[] = [];
  for (const offsetMinutes of offsets) {
    const candidate = new Date(wallUtc - offsetMinutes * 60000);
    const parts = getAmsterdamWallParts(candidate);
    if (parts[0] === year && parts[1] === month && parts[2] === day &&
        parts[3] === hour && parts[4] === minute && parts[5] === second) {
      candidates.push(candidate);
    }
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}

function parseValidDate(value: Date | string): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)) {
    return parseAmsterdamLocalDateTime(value);
  }
  const date = new Date(value);
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
