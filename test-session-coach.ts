import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { createInitialCoachAdviceRecord } from './src/services/sessionCoachService';
import { FishingSession, PrognosisSnapshot } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`[PASS] ${label}`); passed++; }
  else { console.error(`[FAIL] ${label}`); failed++; }
}

async function run() {
  await db.delete();
  await db.open();

  const session: FishingSession = {
    id: 'coach-test-session',
    startTime: '2026-11-05T10:00:00.000Z',
    outcome: 'active',
    targetSpecies: ['Karper'],
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
  };
  const snapshot: PrognosisSnapshot = {
    id: 'coach-test-snapshot',
    runKind: 'session_start',
    linkedSessionId: session.id,
    forecastTimestamp: '2026-11-05T10:00:00.000Z',
    targetDate: '2026-11-05',
    targetSpecies: 'Karper',
    durationHours: 0,
    durationKnown: false,
    predictedActivityScore: 6,
    predictedCatchChance: null,
    source: 'test',
    modelVersion: 'test-v1',
    engineVersions: { prognosis: '1.0.0', waterThermal: '1.0.0' },
    createdAt: '2026-11-05T10:00:00.000Z',
    prognosisData: {
      date: '2026-11-05',
      dayName: 'Vandaag',
      species: 'Karper',
      activityScore: 6,
      advice: 'Gunstig',
      bestTimeSlot: 'Ochtend',
      alternativeTimeSlots: [],
      summaryRationale: 'Testreden voor de startsituatie.',
      personalCatchChance: null,
      personalCatchConfidence: 'Onvoldoende gegevens',
      relevantSessionCount: 0,
      provenance: 'Algemene biologische regels',
      timeSlots: {},
    } as any,
  };

  await db.sessions.put(session);
  await db.prognosisSnapshots.put(snapshot);

  const first = await createInitialCoachAdviceRecord(session, snapshot);
  const second = await createInitialCoachAdviceRecord(session, snapshot);
  const stored = await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray();

  assert(first !== null, 'Startsnapshot levert een eerste coachadvies op');
  assert(first?.trigger === 'session_start', 'Eerste advies is herkenbaar als sessiestartadvies');
  assert(first?.prognosisSnapshotId === snapshot.id, 'Coachadvies verwijst naar de volledige startsnapshot');
  assert(first?.engineVersions?.waterThermal === '1.0.0' && first.engineVersions.prognosis === '1.0.0',
    'Coachadvies bewaart de volledige engineversiekaart van de gebruikte snapshot');
  assert(second?.id === first?.id && stored.length === 1, 'Herhaald opslaan maakt geen dubbele startadviezen');
  assert(!!first && first.recommendation.length > 0 && first.rationale.length > 0, 'Advies bevat een aanbeveling en herleidbare reden');

  await db.delete();
  console.log(`Session coach tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
