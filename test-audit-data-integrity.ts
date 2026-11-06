import 'fake-indexeddb/auto';
import { normalizeRawBackup } from './src/services/backupService';
import { getSessionDurationHours } from './src/services/prognosisEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`[PASS] ${label}`);
    passed++;
  } else {
    console.error(`[FAIL] ${label}`);
    failed++;
  }
}

const normalized = normalizeRawBackup({
  version: 2,
  format: 'vislogboek-backup',
  spots: [],
  sessions: [
    {
      id: 'legacy-completed-no-catch-records',
      date: '2026-10-01',
      status: 'completed',
      technique: 'Feeder',
      weather_moments: [{ data: { temperature_avg_c: 11.5 } }],
    },
    {
      id: 'legacy-catch-with-missing-details',
      date: '2026-10-02',
      status: 'completed',
      catches: [{ id: 'legacy-catch-unknown', weight_kg: 2.1 }],
    },
    {
      id: 'legacy-explicit-skunk',
      date: '2026-10-03',
      outcome: 'skunk_confirmed',
    },
  ],
});

const completedWithoutCatch = normalized.sessions.find((item) => item.id === 'legacy-completed-no-catch-records')!;
assert(completedWithoutCatch.outcome === 'unknown', 'legacy completed session without catch records remains unknown');
assert(completedWithoutCatch.targetSpecies?.length === 0, 'missing target species is not inferred as carp');
assert(completedWithoutCatch.legacyImportQuality?.startTimeKnown === false, 'date-only legacy session is marked as unknown start time');
assert(completedWithoutCatch.legacyImportQuality?.durationKnown === false, 'missing duration is not replaced by three hours');
assert(completedWithoutCatch.endTime === null, 'missing end time is not replaced by 17:00');
assert(completedWithoutCatch.weatherSnapshot === undefined, 'incomplete legacy weather is not filled with defaults');

const incompleteCatch = normalized.catches.find((item) => item.id === 'legacy-catch-unknown')!;
assert(incompleteCatch.species === 'Overig' && incompleteCatch.legacyImportQuality?.speciesKnown === false, 'missing catch species is explicitly marked unknown');
assert(incompleteCatch.count === 0 && incompleteCatch.legacyImportQuality?.countKnown === false, 'missing catch count is not replaced by one');
assert(incompleteCatch.legacyImportQuality?.timestampKnown === false, 'missing catch timestamp is marked unknown');

const explicitSkunk = normalized.sessions.find((item) => item.id === 'legacy-explicit-skunk')!;
assert(explicitSkunk.outcome === 'skunk_confirmed', 'explicitly recorded skunk remains confirmed');

const plannedOnly = {
  id: 'planned-only',
  startTime: '2026-10-01T08:00:00.000Z',
  plannedEndTime: '2026-10-01T12:00:00.000Z',
  plannedDurationHours: 4,
  outcome: 'unknown' as const,
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
};
assert(getSessionDurationHours(plannedOnly) === null, 'planned duration is not treated as actual fishing exposure');

const actualDuration = {
  ...plannedOnly,
  endTime: '2026-10-01T10:00:00.000Z',
  durationMinutes: 120,
};
assert(getSessionDurationHours(actualDuration) === 2, 'actual recorded duration remains usable');

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
