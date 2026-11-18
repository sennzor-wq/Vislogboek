import { SessionRod } from './src/types';
import { calculateTimeSlotRodExposure } from './src/services/timeSlotExposureEngine';

process.env.TZ = 'Europe/Amsterdam';
let passed = 0;
let failed = 0;
function assert(value: boolean, label: string) {
  if (value) { passed++; console.log('[PASS] ' + label); }
  else { failed++; console.error('[FAIL] ' + label); }
}
function rod(id: string, intervals: SessionRod['activeIntervals']): SessionRod {
  return { id, sessionId: 'slot-test', rodNumber: 1, activeIntervals: intervals,
    createdAt: '2026-11-02T08:00:00.000Z', updatedAt: '2026-11-02T12:00:00.000Z' };
}
const interval = (id: string, startTime: string, endTime: string | null) => ({ id, startTime, endTime });

const ordinary = calculateTimeSlotRodExposure([
  rod('r1', [interval('i1', '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z')]),
], '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z');
assert(ordinary.slots.Ochtend.rodHours === 3 && ordinary.slots.Middag.rodHours === 1,
  'Een interval wordt exact verdeeld over Ochtend en Middag volgens Amsterdamse lokale tijd');
assert(ordinary.totalRodHours === 4, 'Som van tijdvakken blijft gelijk aan de totale geregistreerde hengeluren');

const overlap = calculateTimeSlotRodExposure([
  rod('r1', [
    interval('a', '2026-11-02T08:00:00.000Z', '2026-11-02T11:00:00.000Z'),
    interval('b', '2026-11-02T10:00:00.000Z', '2026-11-02T12:00:00.000Z'),
  ]),
  { ...rod('r2', [interval('c', '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z')]), rodNumber: 2 },
], '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z');
assert(overlap.slots.Ochtend.rodHours === 6 && overlap.slots.Middag.rodHours === 2,
  'Overlap wordt per hengel samengevoegd, terwijl verschillende hengels afzonderlijk optellen');
assert(overlap.slots.Ochtend.activeRodCount === 2 && overlap.slots.Middag.activeRodCount === 2,
  'Actieve hengels per tijdvak tellen unieke hengelrecords');

const noIntervals = calculateTimeSlotRodExposure([rod('empty', []), rod('empty2', [])],
  '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z');
assert(!noIntervals.hasRecordedIntervals && noIntervals.rodsWithoutIntervalsCount === 2 &&
  noIntervals.totalRodHours === 0, 'Geen intervalregistraties betekent onbekende blootstelling, niet nul-inzet');

const partial = calculateTimeSlotRodExposure([
  rod('known', [interval('valid', '2026-11-02T08:00:00.000Z', '2026-11-02T09:00:00.000Z')]),
  rod('unknown', []),
  rod('invalid', [{ id: 'missing-end', startTime: '2026-11-02T09:00:00.000Z' }]),
], '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z');
assert(partial.slots.Ochtend.rodHours === 1 && partial.rodsWithoutIntervalsCount === 1 &&
  partial.incompleteIntervalCount === 1, 'Gedeeltelijke dekking blijft een geregistreerd subtotaal met aparte kwaliteitscounts');

const blankEnd = calculateTimeSlotRodExposure([
  rod('blank', [{ id: 'blank', startTime: '2026-11-02T08:00:00.000Z', endTime: '' }]),
], '2026-11-02T08:00:00.000Z', null, new Date('2026-11-02T12:00:00.000Z'));
assert(blankEnd.totalRodHours === 0 && blankEnd.incompleteIntervalCount === 1,
  'Lege eindtijdstring wordt niet gezien als open actieve periode');

const springDst = calculateTimeSlotRodExposure([
  rod('spring', [interval('spring', '2026-03-29T00:30:00.000Z', '2026-03-29T04:30:00.000Z')]),
], '2026-03-29T00:30:00.000Z', '2026-03-29T04:30:00.000Z');
assert(springDst.slots.Nacht.rodHours === 3.5 && springDst.slots.Ochtend.rodHours === 0.5,
  'Lente-DST: tijdvakverdeling volgt de klokverspringing in Europe/Amsterdam');

const autumnDst = calculateTimeSlotRodExposure([
  rod('autumn', [interval('autumn', '2026-10-25T00:30:00.000Z', '2026-10-25T05:30:00.000Z')]),
], '2026-10-25T00:30:00.000Z', '2026-10-25T05:30:00.000Z');
assert(autumnDst.slots.Nacht.rodHours === 4.5 && autumnDst.slots.Ochtend.rodHours === 0.5,
  'Herfst-DST: herhaalde nachturen blijven in Nacht en worden niet dubbel verschoven');

const outside = calculateTimeSlotRodExposure([
  rod('outside', [interval('outside', '2026-11-02T07:00:00.000Z', '2026-11-02T09:00:00.000Z')]),
], '2026-11-02T08:00:00.000Z', '2026-11-02T12:00:00.000Z');
assert(outside.slots.Ochtend.rodHours === 1 && outside.outOfSessionIntervalCount === 1,
  'Intervallen buiten sessiegrenzen worden begrensd en als afwijking geteld');

const open = calculateTimeSlotRodExposure([
  rod('open', [interval('open', '2026-11-02T10:00:00.000Z', null)]),
], '2026-11-02T08:00:00.000Z', null, new Date('2026-11-02T12:00:00.000Z'));
assert(open.slots.Ochtend.rodHours === 1 && open.slots.Middag.rodHours === 1,
  'Open actieve interval telt per tijdvak tot het opgegeven asOf-moment');

const invalidBounds = calculateTimeSlotRodExposure([
  rod('bad', [interval('bad', '2026-11-02T08:00:00.000Z', '2026-11-02T09:00:00.000Z')]),
], '', '2026-11-02T12:00:00.000Z');
assert(invalidBounds.incompleteIntervalCount === 1 && invalidBounds.totalRodHours === 0,
  'Ongeldige sessiegrenzen maken intervallen niet valideerbaar');

console.log(`Time-slot exposure tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
