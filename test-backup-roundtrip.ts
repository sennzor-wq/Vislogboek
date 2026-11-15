import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import {
  collectBackupData,
  restoreBackupData,
  mergeImportData,
  inspectImportFile,
  normalizeRawBackup,
} from './src/services/backupService';
import {
  FishingLocation, FishingSession, CatchItem, WeatherCacheEntry,
  PrognosisSnapshot, PresenceObservation, AppSettings, SessionRod, PlannedFishingSession, CoachAdviceRecord,
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
    durationMinutes: 120, outcome: 'catch', targetSpecies: ['Karper'], rodCount: 2, participantCount: 1,
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
    source: 'test', modelVersion: 'test-v1', engineVersions: { prognosis: '1.0.0', waterThermal: '1.0.0' }, createdAt: '2026-11-02T09:00:00.000Z',
    runKind: 'session_start',
    durationKnown: true,
    inputContext: {
      calculatedAt: '2026-11-02T09:00:00.000Z', timezone: 'Europe/Amsterdam',
      targetDate: '2026-11-02', targetSpecies: 'Karper', sessionDurationHours: 2,
      location: { id: location.id, latitude: 51.9, longitude: 5.2, waterType: 'Kanaal', waterDepth: 2.5 },
      historicalSessionIds: [session.id], catchRecordIds: [catchItem.id], observationIds: [],
      historicalWaterTemperatureSamples: [],
      historySummary: { sessionCount: 1, catchRecordCount: 1, observationCount: 0, historicalWaterTemperatureSampleCount: 0 },
      weatherFetchedAt: '2026-11-02T08:55:00.000Z',
    },
  };
  const rodDetail: SessionRod = {
    id: 'backup-roundtrip-rod-1', sessionId: session.id, rodNumber: 1,
    positionZone: 'Rietkraag', technique: 'Method feeder', baitPresentation: '2 mm pellets',
    activeIntervals: [{ id: 'backup-rod-interval', startTime: '2026-11-02T10:15:00.000Z', endTime: '2026-11-02T11:45:00.000Z' }],
    events: [{ id: 'backup-rod-event', timestamp: '2026-11-02T11:00:00.000Z', type: 'bite', notes: 'Testaanbeet' }],
    createdAt: '2026-11-02T10:00:00.000Z', updatedAt: '2026-11-02T12:00:00.000Z',
  };
  const planned: PlannedFishingSession = {
    id: 'backup-roundtrip-planned', locationId: location.id, targetSpecies: 'Karper',
    plannedStartTime: '2026-11-03T08:00:00.000Z', plannedEndTime: null, status: 'planned',
    planSnapshotId: snapshot.id, createdAt: '2026-11-02T08:00:00.000Z', updatedAt: '2026-11-02T08:00:00.000Z',
  };
  const advice: CoachAdviceRecord = {
    id: 'backup-roundtrip-advice', sessionId: session.id, prognosisSnapshotId: snapshot.id,
    createdAt: '2026-11-02T09:05:00.000Z', trigger: 'session_start', summary: 'Testadvies',
    recommendation: 'Blijf op de stek vissen', rationale: 'Testreden', changedFactors: [],
    coachVersion: 'test-v1',
  };
  const observation: PresenceObservation = {
    id: 'backup-roundtrip-observation', locationId: location.id, sessionId: session.id,
    observationType: 'vis_springen_rollen', timestamp: '2026-11-02T10:30:00.000Z',
    notes: 'Testwaarneming', createdAt: '2026-11-02T10:30:00.000Z',
  };

  await db.locations.put(location);
  await db.sessions.put(session);
  await db.catches.put(catchItem);
  await db.settings.put(settings);
  await db.weatherCache.put(weather);
  await db.prognosisSnapshots.put(snapshot);
  await db.presenceObservations.put(observation);
  await db.sessionRods.put(rodDetail);
  await db.plannedSessions.put(planned);
  await db.coachAdviceRecords.put(advice);

  const backup = await collectBackupData();
  assert(backup.version === 5, 'Nieuwe export gebruikt backupformaat v5');
  assert(backup.locations.length === 1 && backup.sessions.length === 1,
    'Locaties en sessies uit alle records worden geëxporteerd');
  assert(backup.catches.length === 1,
    'Alle vangsten worden geëxporteerd');
  assert(backup.settings?.id === settings.id, 'Instellingen worden geëxporteerd');
  assert(backup.weatherCache?.length === 1, 'Weercache wordt geëxporteerd');
  assert(backup.prognosisSnapshots?.length === 1, 'Prognosehistorie wordt geëxporteerd');
  assert(backup.presenceObservations?.length === 1, 'Aanwezigheidswaarnemingen worden geëxporteerd');
  assert(same(backup.sessionRods, [rodDetail]), 'Per-hengelgegevens, intervallen en gebeurtenissen worden geëxporteerd');
  assert(same(backup.plannedSessions, [planned]), 'Geplande sessies worden geëxporteerd');
  assert(same(backup.coachAdviceRecords, [advice]), 'Coachadvieshistorie wordt geëxporteerd');
  assert(backup.sessions.find(x => x.id === session.id)?.photoUrls?.[0] === session.photoUrls?.[0],
    'Sessiefoto-data blijft behouden in JSON-export');
  assert(backup.catches.find(x => x.id === catchItem.id)?.photoUrl === catchItem.photoUrl,
    'Vangstfoto-data blijft behouden in JSON-export');

  // Simuleer een nieuw toestel: lege database, daarna volledige restore.
  await db.transaction('rw', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
    db.prognosisSnapshots, db.presenceObservations, db.sessionRods, db.plannedSessions, db.coachAdviceRecords], async () => {
      await db.locations.clear();
      await db.sessions.clear();
      await db.catches.clear();
      await db.settings.clear();
      await db.weatherCache.clear();
      await db.prognosisSnapshots.clear();
      await db.presenceObservations.clear();
      await db.sessionRods.clear();
      await db.plannedSessions.clear();
      await db.coachAdviceRecords.clear();
    });
  await restoreBackupData(backup);

  const [locations, sessions, catches, restoredSettings, weatherCache, snapshots, observations, rods, plans, adviceRecords] =
    await Promise.all([db.locations.toArray(), db.sessions.toArray(), db.catches.toArray(),
      db.settings.get('user_settings'), db.weatherCache.toArray(), db.prognosisSnapshots.toArray(),
      db.presenceObservations.toArray(), db.sessionRods.toArray(), db.plannedSessions.toArray(), db.coachAdviceRecords.toArray()]);
  assert(same(locations.sort((a,b)=>a.id.localeCompare(b.id)), backup.locations.sort((a,b)=>a.id.localeCompare(b.id))),
    'Restore herstelt alle locaties en IDs exact');
  assert(same(sessions.sort((a,b)=>a.id.localeCompare(b.id)), backup.sessions.sort((a,b)=>a.id.localeCompare(b.id))),
    'Restore herstelt alle sessies en IDs exact');
  assert(sessions.find((item) => item.id === session.id)?.participantCount === 1,
    'Optioneel deelnemersaantal blijft behouden in backup en restore');
  assert(same(catches.sort((a,b)=>a.id.localeCompare(b.id)), backup.catches.sort((a,b)=>a.id.localeCompare(b.id))),
    'Restore herstelt alle vangsten en IDs exact');
  assert(same(restoredSettings, backup.settings), 'Restore herstelt instellingen exact');
  assert(same(weatherCache, backup.weatherCache), 'Restore herstelt weercache exact');
  assert(same(snapshots, backup.prognosisSnapshots), 'Restore herstelt prognosesnapshots exact');
  assert(same(observations, backup.presenceObservations), 'Restore herstelt waarnemingen exact');
  assert(same(rods, backup.sessionRods), 'Restore herstelt per-hengelrecords, intervallen en gebeurtenissen exact');
  assert(same(plans, backup.plannedSessions), 'Restore herstelt geplande sessies exact');
  assert(same(adviceRecords, backup.coachAdviceRecords), 'Restore herstelt coachadvieshistorie exact');

  // Merge moet ook alle tabellen en de instellingen meenemen, zonder dubbele records.
  await db.settings.put({ ...settings, defaultSpecies: 'Brasem' });
  const merged = await mergeImportData(backup);
  assert(merged.addedLocations === 0 && merged.addedSessions === 0 && merged.addedCatches === 0,
    'Merge voegt bestaande locaties, sessies en vangsten niet dubbel toe');
  assert(merged.addedWeatherCache === 0 && merged.addedPrognosisSnapshots === 0 &&
    merged.addedPresenceObservations === 0 && merged.addedSessionRods === 0 &&
    merged.addedPlannedSessions === 0 && merged.addedCoachAdviceRecords === 0, 'Merge voegt bestaande cache, snapshots, waarnemingen, hengeldetails, plannen en adviezen niet dubbel toe');
  assert(merged.settingsImported && (await db.settings.get('user_settings'))?.defaultSpecies === 'Karper',
    'Merge neemt backupinstellingen over');
  const mergedAgain = await mergeImportData(backup);
  assert(mergedAgain.addedLocations === 0 && mergedAgain.addedSessions === 0 &&
    mergedAgain.addedCatches === 0 && mergedAgain.addedWeatherCache === 0 &&
    mergedAgain.addedPrognosisSnapshots === 0 && mergedAgain.addedPresenceObservations === 0 && mergedAgain.addedSessionRods === 0 &&
    mergedAgain.addedPlannedSessions === 0 && mergedAgain.addedCoachAdviceRecords === 0,
    'Herhaald samenvoegen blijft idempotent en maakt geen duplicaten');

  const imported = await inspectImportFile(JSON.stringify(backup));
  assert(imported.preview.valid && imported.data?.version === 5,
    'Volledige v5-backup wordt gevalideerd vóór import');
  assert(imported.preview.weatherCacheCount === 1 && imported.preview.prognosisSnapshotsCount === 1 &&
    imported.preview.presenceObservationsCount === 1 && imported.preview.sessionRodsCount === 1 &&
    imported.preview.plannedSessionsCount === 1 && imported.preview.coachAdviceRecordsCount === 1, 'Importpreview toont aantallen van alle tabellen inclusief planning en coachadviezen');

  const legacy = normalizeRawBackup({ version: 2, appName: 'Vislogboek', locations: [], sessions: [], catches: [] });
  assert(legacy.weatherCache?.length === 0 && legacy.prognosisSnapshots?.length === 0 &&
    legacy.presenceObservations?.length === 0 && legacy.sessionRods?.length === 0 &&
    legacy.plannedSessions?.length === 0 && legacy.coachAdviceRecords?.length === 0, 'Oudere v2-backup blijft importeerbaar zonder nieuwe tabellen');

  const legacyV3 = normalizeRawBackup({
    version: 3, appName: 'Vislogboek', locations: [location], sessions: [session], catches: [],
    weatherCache: [], prognosisSnapshots: [], presenceObservations: [],
  });
  assert(legacyV3.sessionRods?.length === 0, 'Oudere v3-backup blijft importeerbaar zonder hengeldetailtabel');

  const orphanRodBackup = { ...backup, sessionRods: [{ ...rodDetail, sessionId: 'missing-session' }] };
  const orphanRodImport = await inspectImportFile(JSON.stringify(orphanRodBackup));
  assert(!orphanRodImport.preview.valid, 'Hengeldetail zonder bestaande sessierelatie wordt vóór import geweigerd');

  const duplicateRodBackup = { ...backup, sessionRods: [rodDetail, { ...rodDetail, id: 'backup-roundtrip-rod-duplicate' }] };
  const duplicateRodImport = await inspectImportFile(JSON.stringify(duplicateRodBackup));
  assert(!duplicateRodImport.preview.valid, 'Dubbele hengelnummers binnen één sessie worden vóór import geweigerd');

  const orphanCatch = await inspectImportFile(JSON.stringify({
    ...backup, catches: [{ ...catchItem, sessionId: 'missing-session' }],
  }));
  assert(!orphanCatch.preview.valid, 'Vangst zonder bestaande sessierelatie wordt vóór import geweigerd');

  const orphanSessionLocation = await inspectImportFile(JSON.stringify({
    ...backup, sessions: [session, { ...session, id: 'orphan-location-session', locationId: 'missing-location' }],
  }));
  assert(!orphanSessionLocation.preview.valid, 'Sessie met ontbrekende stekreferentie wordt vóór import geweigerd');

  const orphanSessionSnapshot = await inspectImportFile(JSON.stringify({
    ...backup, sessions: [{ ...session, snapshotId: 'missing-snapshot' }],
  }));
  assert(!orphanSessionSnapshot.preview.valid, 'Sessie met ontbrekende snapshotreferentie wordt vóór import geweigerd');

  const orphanSnapshotSession = await inspectImportFile(JSON.stringify({
    ...backup, prognosisSnapshots: [{ ...snapshot, linkedSessionId: 'missing-session' }],
  }));
  assert(!orphanSnapshotSession.preview.valid, 'Snapshot met ontbrekende sessiereferentie wordt vóór import geweigerd');

  const orphanObservation = await inspectImportFile(JSON.stringify({
    ...backup, presenceObservations: [{ ...observation, sessionId: 'missing-session' }],
  }));
  assert(!orphanObservation.preview.valid, 'Waarneming met ontbrekende sessiereferentie wordt vóór import geweigerd');

  const duplicateCatchId = await inspectImportFile(JSON.stringify({
    ...backup, catches: [catchItem, { ...catchItem }],
  }));
  assert(!duplicateCatchId.preview.valid, 'Dubbele record-IDs binnen één back-uptabel worden vóór import geweigerd');

  const future = await inspectImportFile(JSON.stringify({ version: 6, locations: [], sessions: [], catches: [] }));
  assert(!future.preview.valid, 'Niet-ondersteunde toekomstige backupversie wordt geweigerd');
  const malformed = await inspectImportFile(JSON.stringify({ version: 5, locations: [{ name: 'Geen ID' }], sessions: [], catches: [] }));
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
