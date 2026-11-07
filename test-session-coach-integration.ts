import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { createInitialCoachAdviceRecord, reassessActiveSessions } from './src/services/sessionCoachService';
import { FishingLocation, FishingSession, PrognosisSnapshot, WeatherCacheEntry } from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`[PASS] ${label}`);
    passed++;
  } else {
    console.error(`[FAIL] ${label}`);
    failed++;
  }
}

function makeHourlyForecast(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Array.from({ length: 24 * 8 }, (_, index) => {
    const time = new Date(Date.UTC(year, month - 1, day, index)).toISOString().slice(0, 16);
    return {
      time,
      temperature: 12,
      relativeHumidity: 65,
      dewPoint: 7,
      shortwaveRadiation: 100,
      pressure: 1015,
      windSpeed: 8,
      windDirection: 225,
      windDirectionText: 'ZW',
      precipitation: 0,
      precipitationProbability: 0,
      cloudCover: 40,
      weatherCode: 1,
    };
  });
}

async function run() {
  await db.delete();
  await db.open();

  const now = new Date();
  const nowIso = now.toISOString();
  const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(now);
  const location: FishingLocation = {
    id: 'coach-integration-location',
    name: 'Coach integratietestwater',
    latitude: 52,
    longitude: 5,
    waterDepth: 2,
    waterType: 'Plas/Zandafgraving',
    waterFacingDirection: 'West',
    habitatFeatures: ['talud'],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const session: FishingSession = {
    id: 'coach-integration-session',
    locationId: location.id,
    locationName: location.name,
    startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    outcome: 'active',
    targetSpecies: ['Karper'],
    technique: 'Feeder / Statisch',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const baselinePrognosis = {
    date: dateKey,
    dayName: 'Vandaag',
    species: 'Karper',
    activityScore: 1,
    advice: 'BASELINE_ADVICE',
    bestTimeSlot: 'BASELINE_SLOT',
    alternativeTimeSlots: [],
    summaryRationale: 'Vaste startsituatie voor de integratietest.',
    personalCatchChance: null,
    personalCatchConfidence: 'Onvoldoende gegevens',
    relevantSessionCount: 0,
    provenance: 'Integratietest',
    timeSlots: {},
    positioningAdvice: { recommendedZone: 'BASELINE_ZONE' },
    bankWindAnalysis: {
      relation: 'BASELINE_RELATION',
      rodPlacementAdvice: { primaryPosition: 'BASELINE_POSITION' },
    },
    habitatAnalysis: { primaryZone: { name: 'BASELINE_HABITAT' } },
    prebaitPlan: { suitability: 'BASELINE_PREBAIT' },
  } as any;
  const startSnapshot: PrognosisSnapshot = {
    id: 'coach-integration-start-snapshot',
    runKind: 'session_start',
    linkedSessionId: session.id,
    forecastTimestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    targetDate: dateKey,
    targetSpecies: 'Karper',
    durationHours: 0,
    durationKnown: false,
    predictedActivityScore: 1,
    predictedCatchChance: null,
    source: 'integration-test',
    modelVersion: 'integration-test-v1',
    createdAt: nowIso,
    prognosisData: baselinePrognosis,
  };
  const cacheId = `${location.latitude!.toFixed(2)}_${location.longitude!.toFixed(2)}`;
  const cache: WeatherCacheEntry = {
    id: cacheId,
    latitude: location.latitude!,
    longitude: location.longitude!,
    fetchedAt: nowIso,
    hourly: makeHourlyForecast(dateKey) as any,
    dailySummary: [],
  };

  await db.locations.put(location);
  await db.sessions.put({ ...session, snapshotId: startSnapshot.id });
  await db.prognosisSnapshots.put(startSnapshot);
  await db.weatherCache.put(cache);
  await createInitialCoachAdviceRecord({ ...session, snapshotId: startSnapshot.id }, startSnapshot);

  const first = await reassessActiveSessions('weather_update', session.id);
  assert(
    first.length === 1 && first[0].status === 'unchanged' &&
      first[0].reason?.includes('Mogelijke wijziging'),
    'Een eerste betekenisvolle forecastkandidaat wacht op bevestiging en maakt nog geen advies'
  );
  assert(
    await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count() === 1 &&
      await db.coachAdviceRecords.where('sessionId').equals(session.id).count() === 1,
    'De eerste onbevestigde kandidaat laat startsnapshot en startadvies ongewijzigd'
  );

  const cachedAfterFirst = await db.weatherCache.get(cacheId);
  await db.weatherCache.put({
    ...cachedAfterFirst!,
    // Dit extra veld wijzigt de invoerfingerprint maar wordt door de prognose-engine genegeerd.
    // De praktische prognose blijft daardoor gelijk terwijl er wel een nieuwe invoer is beoordeeld.
    hourly: cachedAfterFirst!.hourly.map((hour) => ({ ...hour, refreshMarker: 2 })) as any,
  });

  const second = await reassessActiveSessions('weather_update', session.id);
  const snapshotsAfterSecond = await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).toArray();
  const adviceAfterSecond = await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray();
  assert(
    second.length === 1 && second[0].status === 'snapshot_created',
    'Dezelfde praktische wijziging bij een volgende afwijkende forecastinvoer wordt bevestigd'
  );
  assert(
    snapshotsAfterSecond.length === 2 && adviceAfterSecond.length === 2,
    'Bevestigde wijziging bewaart precies één tussentijdse snapshot en één coachadvies'
  );
  assert(
    adviceAfterSecond.some((advice) =>
      advice.prognosisSnapshotId === snapshotsAfterSecond.find((snapshot) => snapshot.runKind === 'session_update')?.id &&
      advice.previousAdviceId === adviceAfterSecond.find((item) => item.trigger === 'session_start')?.id
    ),
    'Tussentijds advies verwijst naar de nieuwe snapshot en het vorige getoonde advies'
  );

  const third = await reassessActiveSessions('weather_update', session.id);
  assert(
    third.length === 1 && third[0].status === 'unchanged' &&
      await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count() === 2 &&
      await db.coachAdviceRecords.where('sessionId').equals(session.id).count() === 2,
    'Herhaalde identieke forecastinvoer maakt geen extra snapshot of advies'
  );

  const originalFetch = globalThis.fetch;
  try {
    await db.weatherCache.update(cacheId, {
      fetchedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    globalThis.fetch = (async () => new Response('offline', { status: 503 })) as typeof fetch;
    const offlineResume = await reassessActiveSessions('app_resume', session.id);
    assert(
      offlineResume.length === 1 && offlineResume[0].status === 'unchanged',
      'Hervatten zonder netwerk gebruikt de gecachete weersverwachting en faalt niet'
    );
    assert(
      await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count() === 2 &&
        await db.coachAdviceRecords.where('sessionId').equals(session.id).count() === 2,
      'Offline hervatten met dezelfde gecachete invoer maakt geen dubbele coachregistraties'
    );
  } finally {
    globalThis.fetch = originalFetch;
    await db.delete();
  }

  console.log(`Session coach integration tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
