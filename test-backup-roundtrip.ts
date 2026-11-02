import 'fake-indexeddb/auto';
import { db, BENCHMARK_LOCATION, BENCHMARK_SESSION, BENCHMARK_CATCHES } from './src/db/db';
import {
  collectBackupData,
  restoreBackupData,
  inspectImportFile,
  normalizeRawBackup,
} from './src/services/backupService';
import {
  FishingLocation, FishingSession, CatchItem, WeatherCacheEntry,
  PrognosisSnapshot, PresenceObservation, AppSettings,
} from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`[PASS] ${label}`); passed++; }
  else { console.error(`[FAIL] ${label}`); failed++; }
}
function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function run() {
  await db.delete();
  await db.open();

  const location: FishingLocation = {
    id: 'backup-roundtrip-location', name: 'Testwater', latitude: 52.1, longitude: 5.1,
    createdAt: '2026-11-02T10:00:00.000Z', updatedAt: '2026-11-02T10:00:00.000Z',
  };
  const session: FishingSession = {
    id: 'backup-roundtrip-session', locationId: location.id, locationName: location.name,
    startTime: '2026-11-02T10:00:00.000Z', endTime: '2026-11-02T12:00:00.000Z',
    durationMinutes: 120, outcome: 'catch', targetSpecies: ['Karper'], rodCount: 2,
    photoUrls: ['data:image/png;base64,c2Vzc2ll'],
    createdAt: '2026-11-02T10:00:00.000Z', updatedAt: '2026-11-02T12:00:00.000Z',
  };
  const catchItem: CatchItem = {
    id: 'backup-roundtrip-catch', sessionId: session.id, locationId: location.id,
    species: 'Karper', count: 1, timestamp: '2026-11-02T11:00:00.000Z',
    photoUrl: 'data:image/jpeg;base64,dmFuZ3N0',
    createdAt: '2026-11-02T11:00:00.000Z',
  };
  const settings: AppSettings = {
    id: 'user_settings', defaultLocationName: location.name, defaultLatitude: 52.1,
    defaultLongitude: 5.1, defaultSpecies: 'Karper', defaultDurationHours: 3, theme: 'dark',
    homeLocation: { latitude: 52.2, longitude: 5.2, label: 'Thuis' } as any,
  };
  const weather: WeatherCacheEntry = {
    id: '52.1_5.1', latitude: 52.1, longitude: 5.1, fetchedAt: '2026-11-02T09:00:00.000Z',
    hourly: [], dailySummary: [],
  };
  const snapshot: PrognosisSnapshot = {
    id: 'backup-roundtrip-snapshot', forecastTimestamp: '2026-11-02T09:00:00.000Z',
    targetDate: '2026-11-02', targetSpecies: 'Karper', locationId: location.id,
    durationHours: 2, predictedActivityScore: 6, predictedCatchChance: 42,
    predictedConditions: { temperature: 10, pressure: 1015, windSpeed: 8, windDirection: 180,
      cloudCover: 50, precipitation: 0, source: 'handmatig', capturedAt: '2026-11-02T09:00:00.000Z' },
    source: 'test', modelVersion: 'test-v1', createdAt: '2026-11-02T09:00:00.000Z',
  };
  const observation: PresenceObservation = {
    id: 'backup-roundtrip-observation', locationId: location.id, sessionId: session.id,
    observationType: 'vis_springen_rollen', timestamp: '2026-11-02T10:30:00.000Z',
    notes: 'Testwaarneming', createdAt: '2026-11-02T10:30:00.000Z',
  };

  await db.locations.bulkPut([BENCHMARK_LOCATION, location]);
  await db.sessions.bulkPut([BENCHMARK_SESSION, session]);
  await db.catches.bulkPut([...BENCHMARK_CATCHES, catchItem]);
  await db.settings.put(settings);
  await db.weatherCache.put(weather);
  await db.prognosisSnapshots.put(snapshot);
  await db.presenceObservations.put(observation);

  const backup = await collectBackupData();
  assert(backup.version === 3, 'Nieuwe export gebruikt backupformaat v3');
  assert(backup.locations.length === 2 && backup.sessions.length === 2,
    'Locaties en sessies uit alle records worden geëxporteerd');
  assert(backup.catches.length === BENCHMARK_CATCHES.length + 1,
    'Alle vangsten worden geëxporteerd');
  assert(backup.settings?.id === settings.id, 'Instellingen worden geëxporteerd');
  assert(backup.weatherCache?.length === 1, 'Weercache wordt geëxporteerd');
  assert(backup.prognosisSnapshots?.length === 1, 'Prognosehistorie wordt geëxporteerd');
  assert(backup.presenceObservations?.length === 1, 'Aanwezigheidswaarnemingen worden geëxporteerd');
  assert(backup.sessions.find(x => x.id === session.id)?.photoUrls?.[0] === session.photoUrls?.[0],
    'Sessiefoto-data blijft behouden in JSON-export');
  assert(backup.catches.find(x => x.id === catchItem.id)?.photoUrl === catchItem.photoUrl,
    'Vangstfoto-data blijft behouden in JSON-export');

  // Simuleer een nieuw toestel: lege database, daarna volledige restore.
  await db.transaction('rw', db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
    db.prognosisSnapshots, db.presenceObservations, async () => {
      await Promise.all([db.locations.clear(), db.sessions.clear(), db.catches.clear(), db.settings.clear(),
        db.weatherCache.clear(), db.prognosisSnapshots.clear(), db.presenceObservations.clear()]);
    });
  await restoreBackupData(backup);

  const [locations, sessions, catches, restoredSettings, weatherCache, snapshots, observations] =
    await Promise.all([db.locations.toArray(), db.sessions.toArray(), db.catches.toArray(),
      db.settings.get('user_settings'), db.weatherCache.toArray(), db.prognosisSnapshots.toArray(),
      db.presenceObservations.toArray()]);
  assert(same(locations.sort((a,b)=>a.id.localeCompare(b.id)), backup.locations.sort((a,b)=>a.id.localeCompare(b.id))),
    'Restore herstelt alle locaties en IDs exact');
  assert(same(sessions.sort((a,b)=>a.id.localeCompare(b.id)), backup.sessions.sort((a,b)=>a.id.localeCompare(b.id))),
    'Restore herstelt alle sessies en IDs exact');
  assert(same(catches.sort((a,b)=>a.id.localeCompare(b.id)), backup.catches.sort((a,b)=>a.id.localeCompare(b.id))),
    'Restore herstelt alle vangsten en IDs exact');
  assert(same(restoredSettings, backup.settings), 'Restore herstelt instellingen exact');
  assert(same(weatherCache, backup.weatherCache), 'Restore herstelt weercache exact');
  assert(same(snapshots, backup.prognosisSnapshots), 'Restore herstelt prognosesnapshots exact');
  assert(same(observations, backup.presenceObservations), 'Restore herstelt waarnemingen exact');

  const imported = await inspectImportFile(JSON.stringify(backup));
  assert(imported.preview.valid && imported.data?.version === 3,
    'Volledige v3-backup wordt gevalideerd vóór import');
  assert(imported.preview.weatherCacheCount === 1 && imported.preview.prognosisSnapshotsCount === 1 &&
    imported.preview.presenceObservationsCount === 1, 'Importpreview toont aantallen van alle extra tabellen');

  const legacy = normalizeRawBackup({ version: 2, appName: 'Vislogboek', locations: [], sessions: [], catches: [] });
  assert(legacy.weatherCache?.length === 0 && legacy.prognosisSnapshots?.length === 0 &&
    legacy.presenceObservations?.length === 0, 'Oudere v2-backup blijft importeerbaar zonder nieuwe tabellen');

  const future = await inspectImportFile(JSON.stringify({ version: 4, locations: [], sessions: [], catches: [] }));
  assert(!future.preview.valid, 'Niet-ondersteunde toekomstige backupversie wordt geweigerd');
  const malformed = await inspectImportFile(JSON.stringify({ version: 3, locations: [{ name: 'Geen ID' }], sessions: [], catches: [] }));
  assert(!malformed.preview.valid, 'Record zonder ID wordt vóór databasewijziging geweigerd');

  await db.delete();
  console.log(`Backup round-trip tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch(async error => {
  console.error(error);
  try { await db.delete(); } catch {}
  process.exit(1);
});
