import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db } from './src/db/db';
import { FishingSession, PrognosisSnapshot } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`[PASS] ${label}`); passed++; }
  else { console.error(`[FAIL] ${label}`); failed++; }
}

async function run() {
  await db.delete();
  const legacy = new Dexie('VislogboekDB');
  const v1 = {
    locations: 'id, name, isBenchmark, createdAt',
    sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
    catches: 'id, sessionId, locationId, species, timestamp, createdAt',
    weatherCache: 'id, latitude, longitude, fetchedAt',
    settings: 'id',
  };
  const v2 = { ...v1, prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt',
    presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt' };
  const v3 = { ...v2, sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt' };
  const v4 = { ...v3, plannedSessions: 'id, locationId, plannedStartTime, status, startedSessionId, planSnapshotId, createdAt',
    coachAdviceRecords: 'id, sessionId, prognosisSnapshotId, previousAdviceId, createdAt, trigger' };
  legacy.version(1).stores(v1);
  legacy.version(2).stores(v2);
  legacy.version(3).stores(v3);
  legacy.version(4).stores(v4);
  legacy.version(5).stores(v4);
  await legacy.open();

  const location = { id: 'measurement-migration-location', name: 'Testwater', latitude: 52, longitude: 5,
    createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z' };
  const session: FishingSession = {
    id: 'measurement-migration-session', locationId: location.id, locationName: location.name,
    startTime: '2026-11-01T10:00:00.000Z', outcome: 'unknown',
    waterTemperature: 8.2, waterTemperatureMeasuredAt: '2026-11-01T12:00:00.000Z',
    waterTemperatureMeasurementSource: 'manual', waterTemperatureMeasurementMethod: 'thermometer',
    waterTemperatureMeasurementDepthM: 0.5,
    createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T12:01:00.000Z',
  };
  const duplicateSnapshot: PrognosisSnapshot = {
    id: 'measurement-migration-duplicate-snapshot', forecastTimestamp: '2026-11-01T09:00:00.000Z',
    targetDate: '2026-11-01', targetSpecies: 'Karper', locationId: location.id, linkedSessionId: session.id,
    durationHours: 2, predictedActivityScore: 5, predictedCatchChance: 40,
    actualWaterTemperature: 8.2, actualWaterTemperatureTimestamp: '2026-11-01T12:00:00.000Z',
    actualWaterTemperatureMeasurementSource: 'manual', actualWaterTemperatureMeasurementMethod: 'thermometer',
    actualWaterTemperatureMeasurementDepthM: 0.5,
    source: 'test', modelVersion: 'test', createdAt: '2026-11-01T12:02:00.000Z',
  };
  const independentSnapshot: PrognosisSnapshot = {
    ...duplicateSnapshot,
    id: 'measurement-migration-independent-snapshot',
    linkedSessionId: undefined,
    actualWaterTemperature: 9.1,
    actualWaterTemperatureTimestamp: '2026-11-01T16:00:00.000Z',
    createdAt: '2026-11-01T16:01:00.000Z',
  };
  await legacy.table('locations').put(location);
  await legacy.table('sessions').put(session);
  await legacy.table('prognosisSnapshots').bulkPut([duplicateSnapshot, independentSnapshot]);
  await legacy.close();

  await db.open();
  const migrated = await db.waterTemperatureMeasurements.toArray();
  assert(await db.sessions.get(session.id) !== undefined, 'v6-migratie behoudt bestaande sessies');
  assert(migrated.length === 2, 'Sessiemeting en dubbele snapshot worden één fysiek meetevent; losse snapshotmeting blijft behouden');
  const sessionEvent = migrated.find((item) => item.sessionId === session.id);
  assert(sessionEvent?.temperatureC === 8.2 && sessionEvent.measurementDepthM === 0.5 &&
    sessionEvent.measurementMethod === 'thermometer' && sessionEvent.measuredAt === session.waterTemperatureMeasuredAt,
    'Migratie behoudt meetwaarde, fysiek meettijdstip, methode en meetdiepte');
  const independentEvent = migrated.find((item) => item.temperatureC === 9.1);
  assert(independentEvent !== undefined && !independentEvent.sessionId,
    'Een niet aan een sessie gekoppelde snapshotmeting blijft behouden zonder fictieve sessiekoppeling');
  assert(migrated.every((item) => !item.weatherContext),
    'Migratie verzint geen historische weerscontext die niet in de bron was vastgelegd');

  await db.delete();
  console.log(`Watertemperatuurmeetevent-migratie: ${passed} geslaagd, ${failed} mislukt.`);
  if (failed > 0) process.exit(1);
}

run().catch(async (error) => {
  console.error(error);
  try { await db.delete(); } catch {}
  process.exit(1);
});
