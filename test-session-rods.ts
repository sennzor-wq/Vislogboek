import { FishingSession, SessionRod } from './src/types';
import { calculateSessionRodEffort } from './src/services/sessionEffortEngine';

let passed = 0;
let failed = 0;
function assert(value: boolean, label: string) {
  if (value) { passed++; console.log('[PASS] ' + label); }
  else { failed++; console.error('[FAIL] ' + label); }
}
function rod(id: string, number: number, intervals: SessionRod['activeIntervals']): SessionRod {
  return { id, sessionId: 'session-test', rodNumber: number, activeIntervals: intervals,
    createdAt: '2026-11-02T08:00:00.000Z', updatedAt: '2026-11-02T12:00:00.000Z' };
}
const start = '2026-11-02T08:00:00.000Z';
const end = '2026-11-02T12:00:00.000Z';
const interval = (id: string, from: string, to: string) => ({ id, startTime: from, endTime: to });

// 1 visser / 2 hengels: hengeluren zijn de som van beide hengels, niet twee sessies.
const twoRods = calculateSessionRodEffort([
  rod('r1', 1, [interval('a', '2026-11-02T08:00:00Z', '2026-11-02T11:00:00Z')]),
  rod('r2', 2, [interval('b', '2026-11-02T08:00:00Z', '2026-11-02T11:00:00Z')]),
], start, end);
assert(twoRods.totalRodHours === 6 && twoRods.activeRodCount === 2, '1 visser met 2 hengels levert 6 hengeluren op');

// 3 vissers / 6 hengels: groepsaantal blijft sessiemetadata, inspanning telt actieve intervallen.
const sixRods = calculateSessionRodEffort(Array.from({ length: 6 }, (_, i) =>
  rod('group-' + i, i + 1, [interval('g-' + i, '2026-11-02T09:00:00Z', '2026-11-02T11:00:00Z')])
), start, end);
assert(sixRods.totalRodHours === 12 && sixRods.activeRodCount === 6, '3 vissers met 6 hengels levert 12 hengeluren op');
const groupSession: FishingSession = {
  id: 'group-session', startTime: start, endTime: end, outcome: 'catch',
  participantCount: 3, rodCount: 6, createdAt: start, updatedAt: end,
};
assert(groupSession.participantCount === 3 && groupSession.rodCount === 6,
  'Groepsgrootte en totaal aantal hengels blijven metadata van één primaire sessie');

// Ongelijke tijden en overlap per hengel.
const unequal = calculateSessionRodEffort([
  rod('u1', 1, [
    interval('u1a', '2026-11-02T08:00:00Z', '2026-11-02T10:00:00Z'),
    interval('u1b', '2026-11-02T09:30:00Z', '2026-11-02T11:00:00Z'),
  ]),
  rod('u2', 2, [interval('u2a', '2026-11-02T08:30:00Z', '2026-11-02T10:00:00Z')]),
], start, end);
assert(unequal.totalRodHours === 4.5, 'Ongelijke tijden worden per hengel opgeteld en overlap telt niet dubbel');

// Ontbrekende/ongeldige intervallen leveren geen verzonnen inzet op.
const missing = calculateSessionRodEffort([
  rod('m1', 1, [{ id: 'missing-end', startTime: '2026-11-02T08:00:00Z' }]),
  rod('m2', 2, []),
], start, end);
assert(missing.totalRodHours === 0 && missing.incompleteIntervalCount === 1, 'Ontbrekende intervallen worden niet afgeleid uit sessieduur of rodCount');

// Oude sessies zonder detailrecords blijven valide en geven geen kunstmatige hengeluren.
const legacy = calculateSessionRodEffort([], start, end);
assert(!legacy.hasDetailData && legacy.totalRodHours === 0, 'Oude sessie zonder hengeldetails blijft bruikbaar zonder fictieve inspanning');

// Een nog lopende interval telt alleen tot expliciete asOf-tijd.
const ongoing = calculateSessionRodEffort([
  rod('open', 1, [{ id: 'open-1', startTime: '2026-11-02T10:00:00Z', endTime: null }]),
], start, null, new Date('2026-11-02T11:30:00Z'));
assert(ongoing.totalRodHours === 1.5, 'Open interval van actieve sessie telt tot het opgegeven meetmoment');

console.log(`Session rod effort tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
