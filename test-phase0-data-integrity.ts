import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { normalizeRawBackup } from './src/services/backupService';
import { getSessionDurationHours, getActualSessionDurationHours } from './src/services/prognosisEngine';
import type { FishingSession } from './src/types';

const imported = normalizeRawBackup({
  version: 2,
  format: 'vislogboek-backup',
  spots: [],
  sessions: [
    {
      id: 'legacy-completed-without-catches',
      date: '2026-10-01',
      status: 'completed',
      created_at: '2026-10-01T18:00:00.000Z',
      catches: [],
    },
    {
      id: 'legacy-explicit-blank',
      date: '2026-10-02',
      status: 'completed',
      outcome: 'skunk_confirmed',
      start_time: '18:00',
      end_time: '21:00',
      targetSpecies: ['Karper'],
      created_at: '2026-10-02T21:00:00.000Z',
      catches: [],
    },
    {
      id: 'legacy-cross-midnight',
      date: '2026-10-03',
      end_date: '2026-10-04',
      status: 'completed',
      outcome: 'skunk_confirmed',
      start_time: '22:00',
      end_time: '02:00',
      targetSpecies: ['Karper'],
      created_at: '2026-10-04T02:00:00.000Z',
      catches: [],
    },
    {
      id: 'legacy-unknown-catch-species',
      date: '2026-10-04',
      status: 'completed',
      targetSpecies: ['Karper'],
      created_at: '2026-10-03T20:00:00.000Z',
      catches: [{ id: 'catch-unknown-species', count: undefined }],
    },
  ],
});

const unknownSession = imported.sessions.find((session) => session.id === 'legacy-completed-without-catches');
assert.ok(unknownSession);
assert.equal(unknownSession.outcome, 'unknown', 'completed without catch records is not a confirmed blank');
assert.deepEqual(unknownSession.targetSpecies, [], 'missing target species remains unknown');
assert.equal(unknownSession.dataQuality?.targetSpeciesKnown, false);
assert.equal(unknownSession.dataQuality?.outcomeConfirmed, false);
assert.equal(unknownSession.durationMinutes, undefined, 'missing duration is not defaulted');
assert.equal(unknownSession.endTime, undefined, 'missing end time is not fabricated');
assert.equal(unknownSession.dataQuality?.startTimeKnown, false);
assert.equal(unknownSession.weatherSnapshot, undefined, 'incomplete weather is not fabricated');

const explicitBlank = imported.sessions.find((session) => session.id === 'legacy-explicit-blank');
assert.ok(explicitBlank);
assert.equal(explicitBlank.outcome, 'skunk_confirmed');
assert.equal(explicitBlank.durationMinutes, 180);
assert.equal(explicitBlank.dataQuality?.outcomeConfirmed, true);

const crossMidnight = imported.sessions.find((session) => session.id === 'legacy-cross-midnight');
assert.ok(crossMidnight);
assert.equal(crossMidnight.durationMinutes, 240, 'duration respects explicit end date across midnight');

const unknownCatch = imported.catches.find((item) => item.id === 'catch-unknown-species');
assert.ok(unknownCatch);
assert.equal(unknownCatch.species, 'Overig');
assert.equal(unknownCatch.dataQuality?.speciesKnown, false);
assert.equal(unknownCatch.count, 1);
assert.equal(unknownCatch.dataQuality?.countKnown, false);
assert.equal(unknownCatch.dataQuality?.timestampKnown, false);

const plannedOnly: FishingSession = {
  id: 'planned-only',
  startTime: '2026-10-04T18:00:00.000Z',
  plannedEndTime: '2026-10-04T21:00:00.000Z',
  plannedDurationHours: 3,
  outcome: 'unknown',
  createdAt: '2026-10-04T17:00:00.000Z',
  updatedAt: '2026-10-04T17:00:00.000Z',
};
assert.equal(getSessionDurationHours(plannedOnly), 3, 'planning helper retains the live-session horizon');
assert.equal(getActualSessionDurationHours(plannedOnly), null, 'planned duration is not actual fishing exposure');

const actualDuration: FishingSession = {
  ...plannedOnly,
  durationMinutes: 135,
};
assert.equal(getSessionDurationHours(actualDuration), 2.25);

console.log('Fase 0 data-integrity tests geslaagd.');
