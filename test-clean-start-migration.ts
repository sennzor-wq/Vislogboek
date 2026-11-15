import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db, initializeDatabase } from './src/db/db';
import { FishingSession, PrognosisSnapshot, PresenceObservation, PlannedFishingSession } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`[PASS] ${label}`); passed++; }
  else { console.error(`[FAIL] ${label}`); failed++; }
}

async function run() {
  await db.delete();

  // Bouw een representatieve v4-database zoals die vóór de update op een toestel bestaat.
  const legacy = new Dexie('VislogboekDB');
  const v1 = {
    locations: 'id, name, isBenchmark, createdAt',
    sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
    catches: 'id, sessionId, locationId, species, timestamp, createdAt',
    weatherCache: 'id, latitude, longitude, fetchedAt',
    settings: 'id',
  };
  legacy.version(1).stores(v1);
  legacy.version(2).stores({ ...v1, prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt', presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt' });
  legacy.version(3).stores({ ...v1, prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt', presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt', sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt' });
  legacy.version(4).stores({ ...v1, prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt', presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt', sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt', plannedSessions: 'id, locationId, plannedStartTime, status, startedSessionId, planSnapshotId, createdAt', coachAdviceRecords: 'id, sessionId, prognosisSnapshotId, previousAdviceId, createdAt, trigger' });
  await legacy.open();

  const location = { id: 'keep-location', name: 'Testwater', latitude: 52, longitude: 5, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  const benchmarkLocation = { id: 'benchmark-location-lokkershoek', name: 'Old demo location', latitude: 51, longitude: 5, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  const session: FishingSession = { id: 'old-session', locationId: location.id, locationName: location.name, startTime: '2026-10-01T10:00:00Z', outcome: 'catch', snapshotId: 'keep-snapshot', createdAt: '2026-10-01', updatedAt: '2026-10-01' };
  const emptySession: FishingSession = { id: 'old-empty-session', locationId: location.id, startTime: '2026-10-02T10:00:00Z', outcome: 'skunk_confirmed', createdAt: '2026-10-02', updatedAt: '2026-10-02' };
  const snapshot: PrognosisSnapshot = { id: 'keep-snapshot', forecastTimestamp: '2026-10-01T09:00:00Z', targetDate: '2026-10-01', targetSpecies: 'Karper', locationId: location.id, durationHours: 2, predictedActivityScore: 6, predictedCatchChance: 50, source: 'test', modelVersion: 'test', linkedSessionId: session.id, actualOutcome: 'catch', actualTargetCatchesCount: 2, evaluationNotes: 'evaluated', createdAt: '2026-10-01' };
  const sessionObservation: PresenceObservation = { id: 'session-observation', locationId: location.id, sessionId: session.id, observationType: 'vis_springen_rollen', timestamp: '2026-10-01T10:00:00Z', createdAt: '2026-10-01' };
  const locationObservation: PresenceObservation = { id: 'location-observation', locationId: location.id, observationType: 'vis_springen_rollen', timestamp: '2026-10-01T11:00:00Z', createdAt: '2026-10-01' };
  const planned: PlannedFishingSession = { id: 'keep-plan', locationId: location.id, targetSpecies: 'Karper', plannedStartTime: '2026-11-01T10:00:00Z', status: 'started', startedSessionId: session.id, createdAt: '2026-10-01', updatedAt: '2026-10-01' };

  await legacy.table('locations').bulkPut([location, benchmarkLocation]);
  await legacy.table('sessions').bulkPut([session, emptySession]);
  await legacy.table('catches').put({ id: 'old-catch', sessionId: session.id, locationId: location.id, species: 'Karper', count: 1, timestamp: '2026-10-01T10:30:00Z', createdAt: '2026-10-01' });
  await legacy.table('weatherCache').put({ id: 'weather', latitude: 52, longitude: 5, fetchedAt: '2026-10-01', hourly: [] });
  await legacy.table('prognosisSnapshots').put(snapshot);
  await legacy.table('presenceObservations').bulkPut([sessionObservation, locationObservation]);
  await legacy.table('sessionRods').put({ id: 'old-rod', sessionId: session.id, rodNumber: 1, activeIntervals: [], createdAt: '2026-10-01', updatedAt: '2026-10-01' });
  await legacy.table('plannedSessions').put(planned);
  await legacy.table('coachAdviceRecords').put({ id: 'old-advice', sessionId: session.id, prognosisSnapshotId: snapshot.id, createdAt: '2026-10-01', trigger: 'session_start', summary: 'old', recommendation: 'old', rationale: 'old', changedFactors: [], coachVersion: 'test' });
  await legacy.close();

  await db.open();
  assert(await db.sessions.count() === 0, 'Migratie verwijdert alle oude sessies, ook nulvangstsessies');
  assert(await db.catches.count() === 0, 'Migratie verwijdert alle oude vangsten');
  assert(await db.sessionRods.count() === 0, 'Sessiegebonden hengeldetails worden verwijderd');
  assert(await db.coachAdviceRecords.count() === 0, 'Sessiegebonden coachadviezen worden verwijderd');
  assert(await db.locations.get(location.id) !== undefined, 'Gewone locaties blijven behouden');
  assert(await db.locations.get('benchmark-location-lokkershoek') === undefined, 'Oude benchmarklocatie wordt verwijderd als geen plan ernaar verwijst');
  assert(await db.weatherCache.get('weather') !== undefined, 'Weercache blijft behouden');
  assert(await db.presenceObservations.get(sessionObservation.id) === undefined, 'Waarneming met verwijderde sessiekoppeling wordt verwijderd');
  assert(await db.presenceObservations.get(locationObservation.id) !== undefined, 'Losse locatie-waarneming blijft behouden');

  const migratedSnapshot = await db.prognosisSnapshots.get(snapshot.id);
  assert(Boolean(migratedSnapshot) && !migratedSnapshot?.linkedSessionId && !migratedSnapshot?.actualOutcome &&
    migratedSnapshot?.actualTargetCatchesCount === undefined && migratedSnapshot?.evaluationNotes === undefined,
    'Prognosesnapshot blijft bestaan maar wordt ontkoppeld en niet langer geëvalueerd');
  const migratedPlan = await db.plannedSessions.get(planned.id);
  assert(Boolean(migratedPlan) && !migratedPlan?.startedSessionId && Boolean(migratedPlan?.startedSessionDeletedAt),
    'Geplande sessie blijft bestaan en verliest alleen de verwijzing naar oude sessie');

  await db.delete();
  await db.open();
  await initializeDatabase();
  assert(await db.locations.count() === 0, 'Nieuwe installatie krijgt geen automatisch geladen historische locaties');
  assert(await db.sessions.count() === 0, 'Nieuwe installatie krijgt geen historische sessies');
  assert(await db.catches.count() === 0, 'Nieuwe installatie krijgt geen historische vangsten');

  const freshLocation = { id: 'new-location', name: 'Nieuwe stek', latitude: 52, longitude: 5, createdAt: '2026-11-15', updatedAt: '2026-11-15' };
  await db.locations.put(freshLocation);
  const newSession: FishingSession = { id: 'new-session-2026', locationId: freshLocation.id, startTime: '2026-11-15T10:00:00Z', outcome: 'unknown', createdAt: '2026-11-15', updatedAt: '2026-11-15' };
  await db.sessions.put(newSession);
  await db.catches.put({ id: 'new-catch-2026', sessionId: newSession.id, locationId: freshLocation.id, species: 'Karper', count: 1, timestamp: '2026-11-15T10:30:00Z', createdAt: '2026-11-15' });
  await initializeDatabase();
  assert(await db.sessions.get(newSession.id) !== undefined, 'Nieuwe sessie blijft behouden na herhaald initialiseren');
  assert(await db.catches.get('new-catch-2026') !== undefined, 'Nieuwe vangst blijft behouden na herhaald initialiseren');

  await db.close();
  console.log(`\nClean-start migratietest: ${passed} geslaagd, ${failed} mislukt.`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => { console.error(error); process.exit(1); });
