import { addCalendarDays, getAmsterdamDateKey, getAmsterdamHour, getAmsterdamMonth } from './src/utils/dateTime';

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
assert(getAmsterdamMonth('2026-01-31') === 1,
  'Date-only values retain their calendar month');

assert(getAmsterdamDateKey('2026-03-29T00:30:00.000Z') === '2026-03-29' &&
  getAmsterdamHour('2026-03-29T00:30:00.000Z') === 1,
  'Spring DST transition before the clock jump is interpreted correctly');
assert(getAmsterdamDateKey('2026-03-29T01:30:00.000Z') === '2026-03-29' &&
  getAmsterdamHour('2026-03-29T01:30:00.000Z') === 3,
  'Spring DST transition skips local hour 02 without shifting the date');

assert(getAmsterdamHour('2026-10-25T00:30:00.000Z') === 2 &&
  getAmsterdamHour('2026-10-25T01:30:00.000Z') === 2,
  'Both occurrences of local hour 02 during autumn DST are represented');
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
