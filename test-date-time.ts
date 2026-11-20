import { addCalendarDays, formatDateTimeLocalInput, getAmsterdamDateKey, getAmsterdamHour, getAmsterdamMonth, getAmsterdamTimeSlot, parseAppTimestamp, parseForecastTimestamp } from './src/utils/dateTime';

// datetime-local follows the device timezone; the production audience uses Dutch local time.
process.env.TZ = 'Europe/Amsterdam';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('=== Europe/Amsterdam date and DST regression tests ===');

assert(getAmsterdamDateKey('2026-11-05T23:30:00.000Z') === '2026-11-06',
  'UTC midnight boundary resolves to the correct Amsterdam calendar date');
assert(getAmsterdamHour('2026-11-05T23:30:00.000Z') === 0,
  'Hour extraction uses Amsterdam local time rather than the runtime timezone');
assert(getAmsterdamTimeSlot('2026-01-15T05:59:00') === 'Nacht' &&
  getAmsterdamTimeSlot('2026-01-15T06:00:00') === 'Ochtend' &&
  getAmsterdamTimeSlot('2026-01-15T12:00:00') === 'Middag' &&
  getAmsterdamTimeSlot('2026-01-15T18:00:00') === 'Avond',
  'Time-slot boundaries use the four fixed Amsterdam local periods');
assert(getAmsterdamTimeSlot('not-a-date') === null,
  'Invalid timestamps do not receive a fabricated time slot');

assert(getAmsterdamMonth('2026-01-31') === 1,
  'Date-only values retain their calendar month');
assert(getAmsterdamHour('2026-09-01T12:00:00') === 12,
  'Timezone-less legacy timestamps are interpreted as Amsterdam wall time');
assert(getAmsterdamHour('2026-03-29T02:30:00') === null,
  'A nonexistent local time during spring DST is rejected instead of shifted');
assert(getAmsterdamHour('2026-10-25T02:30:00') === 2,
  'An ambiguous local time during autumn DST is resolved deterministically');
const firstAutumnHour = parseForecastTimestamp('2026-10-25T02:00:00');
const secondAutumnHour = parseForecastTimestamp('2026-10-25T02:00:00', firstAutumnHour?.getTime() ?? Number.NEGATIVE_INFINITY);
assert(firstAutumnHour?.toISOString() === '2026-10-25T00:00:00.000Z' &&
  secondAutumnHour?.toISOString() === '2026-10-25T01:00:00.000Z',
  'Repeated autumn 02:00 forecast values normalize to two distinct absolute instants');
assert(parseAppTimestamp('2026-03-29T02:30:00') === null,
  'App timestamp parser rejects nonexistent Amsterdam spring-forward wall time');
assert(getAmsterdamDateKey(new Date('2026-11-05T23:30:00.000Z')) === '2026-11-06',
  'Date objects use the same Amsterdam date interpretation as ISO timestamps');

assert(getAmsterdamDateKey('2026-03-29T00:30:00.000Z') === '2026-03-29' &&
  getAmsterdamHour('2026-03-29T00:30:00.000Z') === 1,
  'Spring DST transition before the clock jump is interpreted correctly');
assert(getAmsterdamDateKey('2026-03-29T01:30:00.000Z') === '2026-03-29' &&
  getAmsterdamHour('2026-03-29T01:30:00.000Z') === 3,
  'Spring DST transition skips local hour 02 without shifting the date');

assert(getAmsterdamHour('2026-10-25T00:30:00.000Z') === 2 &&
  getAmsterdamHour('2026-10-25T01:30:00.000Z') === 2,
  'Both occurrences of local hour 02 during autumn DST are represented');
assert(formatDateTimeLocalInput('2026-11-07T20:56:00.000Z') === '2026-11-07T21:56',
  'UTC session start timestamps are formatted as the correct Dutch local datetime-local value in winter');
assert(formatDateTimeLocalInput('2026-07-07T19:56:00.000Z') === '2026-07-07T21:56',
  'UTC session start timestamps are formatted as the correct Dutch local datetime-local value in summer');
assert(getAmsterdamDateKey('2026-10-25T23:30:00.000Z') === '2026-10-26',
  'Autumn DST day boundary resolves to the correct local date');

assert(addCalendarDays('2026-03-28', 1) === '2026-03-29' &&
  addCalendarDays('2026-03-28', 2) === '2026-03-30',
  'Calendar-day addition remains stable across spring DST');
assert(addCalendarDays('2026-10-24', 1) === '2026-10-25' &&
  addCalendarDays('2026-10-24', 2) === '2026-10-26',
  'Calendar-day addition remains stable across autumn DST');

assert(addCalendarDays('2026-02-30', 1) === null,
  'Invalid calendar dates are rejected');
assert(getAmsterdamDateKey('not-a-date') === null && getAmsterdamHour('not-a-date') === null,
  'Invalid timestamps are rejected without fabricated values');

console.log(`\nResultaat: ${passed} geslaagd, ${failed} gefaald.`);
if (failed > 0) process.exit(1);
