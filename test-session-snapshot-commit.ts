import 'fake-indexeddb/auto';
import { db, syncSessionPresenceObservations } from './src/db/db';
import { saveSessionWithPrognosisSnapshot, PendingPrognosisSnapshot, createPrognosisInputFingerprint } from './src/services/prognosisEngine';
import { buildVisCoachPlan } from './src/services/viscoachService';
import { segmentPrognosisInterval } from './src/services/prognosisIntervalEngine';
import { FishingSession } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`[PASS] ${label}`); passed++; }
  else { console.error(`[FAIL] ${label}`); failed++; }
}

async function run() {
  await db.delete();
  await db.open();

  const pending: PendingPrognosisSnapshot = {
    prognosis: {
      date: '2026-11-01',
      dayName: 'Zondag',
      species: 'Karper',
      activityScore: 2.6,
      activityScoreAvailable: true,
      bestTimeSlot: 'Avond',
      alternativeTimeSlots: [],
      summaryRationale: 'Testprognose',
      personalCatchChance: null,
      personalCatchConfidence: 'Onvoldoende gegevens',
      relevantSessionCount: 0,
      provenance: 'Algemene aannames',
      timeSlots: {} as any,
    } as any,
    durationHours: 3,
    forecastTimestamp: '2026-11-01T16:59:00.000Z',
    locationName: 'Bomedikke speeltuin',
    chosenSlot: 'Avond',
    targetWindowStart: '2026-11-01T17:00:00.000Z',
    targetWindowEnd: '2026-11-01T20:00:00.000Z',
    inputContext: {
      calculatedAt: '2026-11-01T16:59:00.000Z',
      timezone: 'Europe/Amsterdam',
      targetDate: '2026-11-01',
      targetWindowStart: '2026-11-01T17:00:00.000Z',
      targetWindowEnd: '2026-11-01T20:00:00.000Z',
      targetSpecies: 'Karper',
      sessionDurationHours: 3,
      location: { id: 'spot-bomedikke' },
      historicalWaterTemperatureSamples: [],
      historySummary: { sessionCount: 0, catchRecordCount: 0, observationCount: 0, historicalWaterTemperatureSampleCount: 0 },
    } as any,
  };

  // Annuleren betekent dat de submit-/commitfunctie niet wordt aangeroepen.
  assert((await db.prognosisSnapshots.count()) === 0 && (await db.sessions.count()) === 0,
    'Annuleren vóór bevestigen schrijft geen sessie of snapshot');

  const session: FishingSession = {
    id: 'session-commit-test',
    locationId: 'spot-bomedikke',
    locationName: 'Bomedikke speeltuin',
    startTime: '2026-11-01T17:00:00.000Z',
    outcome: 'active',
    targetSpecies: ['Karper'],
    technique: 'Feeder',
    presenceObservations: ['vis_springen_rollen', 'aasbellen_voedselactiviteit'],
    createdAt: '2026-11-01T16:55:00.000Z',
    updatedAt: '2026-11-01T16:55:00.000Z',
  };

  const saved = await saveSessionWithPrognosisSnapshot(session, pending);
  const storedSession = await db.sessions.get(session.id);
  const storedSnapshot = saved.snapshotId
    ? await db.prognosisSnapshots.get(saved.snapshotId)
    : undefined;

  assert(!!storedSession, 'Bevestigen slaat de sessie op');
  assert(!!storedSnapshot, 'Bevestigen slaat de prognosesnapshot op');
  assert(storedSession?.snapshotId === storedSnapshot?.id,
    'De sessie verwijst naar de aangemaakte snapshot');
  assert(storedSnapshot?.linkedSessionId === session.id,
    'De snapshot verwijst terug naar dezelfde sessie');
  assert(!!storedSnapshot?.engineVersions && Object.keys(storedSnapshot.engineVersions).length >= 8 &&
    storedSnapshot.engineVersions.waterThermal === '1.0.0',
    'De startsnapshot bewaart afzonderlijke versies van de gebruikte prognose-engines');
  assert(storedSnapshot?.targetDate === pending.prognosis.date &&
    storedSnapshot?.targetSlot === pending.chosenSlot,
    'De gekozen prognosedatum en het tijdvak blijven behouden');
  assert(storedSnapshot?.targetWindowStart === pending.targetWindowStart &&
    storedSnapshot?.targetWindowEnd === pending.targetWindowEnd,
    'Het geplande VisCoach-start- en eindvenster blijven behouden in de sessiesnapshot');
  assert(storedSnapshot?.inputContext?.targetWindowStart === storedSnapshot?.targetWindowStart &&
    storedSnapshot?.inputContext?.targetWindowEnd === storedSnapshot?.targetWindowEnd,
    'De intervalgrenzen in PrognosisInputContext zijn identiek aan de bestaande snapshotgrenzen');

  const storedObservations = await db.presenceObservations.where('sessionId').equals(session.id).toArray();
  assert(storedObservations.length === 2,
    'Sessiewaarnemingen worden samen met sessie en prognose in de aparte waarnemingstabel opgeslagen');

  const originalObservationTimestamp = storedObservations[0]?.timestamp;
  await syncSessionPresenceObservations({
    ...session,
    presenceObservations: ['vis_springen_rollen'],
    updatedAt: '2026-11-01T18:00:00.000Z',
  });
  const updatedObservations = await db.presenceObservations.where('sessionId').equals(session.id).toArray();
  assert(updatedObservations.length === 1 && updatedObservations[0].timestamp === originalObservationTimestamp,
    'Bij aanpassen worden verwijderde waarnemingen verwijderd en bestaande registratietijdstippen behouden');

  const invalidSession = { ...session, id: '', snapshotId: undefined };
  let rejected = false;
  try {
    await saveSessionWithPrognosisSnapshot(invalidSession as FishingSession, pending);
  } catch {
    rejected = true;
  }
  assert(rejected, 'Ongeldige sessie wordt geweigerd');
  assert((await db.prognosisSnapshots.count()) === 1,
    'Een ongeldige sessie laat geen extra losse snapshot achter');

  // Test de echte VisCoach-planbuilder tegen een lokale weerscache; geen netwerkverzoek.
  const planLocation = {
    id: 'spot-plan-contract',
    name: 'Contract testwater',
    latitude: 52,
    longitude: 5,
    waterDepth: 2.5,
    waterType: 'Plas/Zandafgraving',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.locations.put(planLocation as any);
  const plannedStart = new Date();
  plannedStart.setMinutes(0, 0, 0);
  plannedStart.setHours(plannedStart.getHours() + 3);
  const weatherHourly = Array.from({ length: 240 }, (_, index) => ({
    time: new Date(plannedStart.getTime() - 96 * 3600000 + index * 3600000).toISOString(),
    temperature: 12,
    pressure: 1016,
    windSpeed: 8,
    windDirection: 225,
    windDirectionText: 'ZW',
    precipitation: 0,
    precipitationProbability: 10,
    cloudCover: 40,
    weatherCode: 1,
    relativeHumidity: 65,
    dewPoint: 8,
    shortwaveRadiation: 300,
  }));
  await db.weatherCache.put({
    id: '52.00_5.00',
    latitude: 52,
    longitude: 5,
    fetchedAt: new Date().toISOString(),
    hourly: weatherHourly,
  });
  const plannedEnd = new Date(plannedStart.getTime() + 3 * 3600000);
  const visCoachPlan = await buildVisCoachPlan({
    location: planLocation as any,
    targetSpecies: 'Karper',
    desiredStartTime: plannedStart.toISOString(),
    desiredEndTime: plannedEnd.toISOString(),
    sessions: [],
    catches: [],
  });
  assert(
    visCoachPlan.pendingSnapshot.inputContext?.targetWindowStart === plannedStart.toISOString() &&
      visCoachPlan.pendingSnapshot.inputContext?.targetWindowEnd === plannedEnd.toISOString() &&
      visCoachPlan.pendingSnapshot.targetWindowStart === plannedStart.toISOString() &&
      visCoachPlan.pendingSnapshot.targetWindowEnd === plannedEnd.toISOString(),
    'VisCoach-planbuilder gebruikt hetzelfde genormaliseerde ISO-interval in context en snapshot'
  );
  assert(
    visCoachPlan.pendingSnapshot.inputContext?.sessionDurationHours === 3 &&
      visCoachPlan.pendingSnapshot.durationHours === 3 &&
      visCoachPlan.pendingSnapshot.durationKnown === true,
    'Bekend interval bewaart dezelfde sessieduur in context en snapshot'
  );
  const expectedPlanFingerprint = createPrognosisInputFingerprint({
    inputContext: visCoachPlan.pendingSnapshot.inputContext,
    date: visCoachPlan.prognosis.date,
    desiredStartTime: plannedStart.toISOString(),
    desiredEndTime: plannedEnd.toISOString(),
    species: 'Karper',
    locationId: planLocation.id,
    weather: visCoachPlan.pendingSnapshot.weatherInput,
  });
  assert(
    visCoachPlan.pendingSnapshot.inputFingerprint === expectedPlanFingerprint,
    'VisCoach-inputfingerprint bevat de volledige intervalcontext en dezelfde ISO-grenzen'
  );
  const changedIntervalFingerprint = createPrognosisInputFingerprint({
    inputContext: {
      ...visCoachPlan.pendingSnapshot.inputContext!,
      targetWindowEnd: new Date(plannedEnd.getTime() + 3600000).toISOString(),
    },
    date: visCoachPlan.prognosis.date,
    desiredStartTime: plannedStart.toISOString(),
    desiredEndTime: plannedEnd.toISOString(),
    species: 'Karper',
    locationId: planLocation.id,
    weather: visCoachPlan.pendingSnapshot.weatherInput,
  });
  assert(
    changedIntervalFingerprint !== visCoachPlan.pendingSnapshot.inputFingerprint,
    'Een gewijzigd eindmoment verandert de inputfingerprint'
  );

  const unknownEndStart = new Date(plannedStart.getTime() + 6 * 3600000);
  const unknownEndPlan = await buildVisCoachPlan({
    location: planLocation as any,
    targetSpecies: 'Karper',
    desiredStartTime: unknownEndStart.toISOString(),
    desiredEndTime: null,
    sessions: [],
    catches: [],
  });
  assert(
    unknownEndPlan.pendingSnapshot.inputContext?.targetWindowStart === unknownEndStart.toISOString() &&
      unknownEndPlan.pendingSnapshot.inputContext?.targetWindowEnd === null &&
      unknownEndPlan.pendingSnapshot.targetWindowEnd === null,
    'Onbekende eindtijd blijft expliciet null in PrognosisInputContext en snapshot'
  );
  assert(
    unknownEndPlan.pendingSnapshot.inputContext?.sessionDurationHours === null &&
      unknownEndPlan.pendingSnapshot.durationKnown === false &&
      unknownEndPlan.pendingSnapshot.durationHours === 0 &&
      unknownEndPlan.durationHours === null,
    'Onbekende eindtijd blijft onbekend en wordt niet omgezet in een standaardduur'
  );

  const intervalForecasts = [
    '2026-11-23T08:00:00.000Z',
    '2026-11-23T09:00:00.000Z',
    '2026-11-23T10:00:00.000Z',
    '2026-11-23T11:00:00.000Z',
    '2026-11-23T12:00:00.000Z',
  ].map((time) => ({
    time,
    temperature: 12,
    pressure: 1016,
    windSpeed: 8,
    windDirection: 225,
    windDirectionText: 'ZW',
    precipitation: 0,
    precipitationProbability: 10,
    cloudCover: 40,
    weatherCode: 1,
  }));
  const partialHourSegments = segmentPrognosisInterval(
    '2026-11-23T09:30:00+01:00',
    '2026-11-23T12:15:00+01:00',
    intervalForecasts
  );
  assert(
    partialHourSegments.status === 'complete' &&
      partialHourSegments.totalDurationMinutes === 165 &&
      partialHourSegments.segments.length === 4 &&
      partialHourSegments.segments[0].durationMinutes === 30 &&
      partialHourSegments.segments[3].timeSlot === 'Middag',
    'Segmentatie knipt gedeeltelijke uren op absolute uurgrenzen en lokale tijdvakgrenzen'
  );
  assert(
    partialHourSegments.segments.every((segment) => segment.targetDate === '2026-11-23') &&
      partialHourSegments.coverageRatio === 1,
    'Volledig gedekte segmenten bewaren Amsterdamse datum en volledige dekking'
  );

  const missingForecastHour = intervalForecasts.filter((hour) => hour.time !== '2026-11-23T09:00:00.000Z');
  const partialCoverage = segmentPrognosisInterval(
    '2026-11-23T09:30:00+01:00',
    '2026-11-23T12:15:00+01:00',
    missingForecastHour
  );
  assert(
    partialCoverage.status === 'partial' &&
      partialCoverage.uncoveredDurationMinutes === 60 &&
      partialCoverage.coverageRatio === 105 / 165 &&
      partialCoverage.segments.some((segment) => !segment.weatherAvailable && segment.durationMinutes === 60),
    'Ontbrekend forecastuur blijft een expliciet onbekend segment zonder interpolatie'
  );

  const midnightSegments = segmentPrognosisInterval(
    '2026-11-23T23:30:00+01:00',
    '2026-11-24T01:15:00+01:00',
    [
      '2026-11-23T22:00:00.000Z',
      '2026-11-23T23:00:00.000Z',
      '2026-11-24T00:00:00.000Z',
    ].map((time) => ({ ...intervalForecasts[0], time }))
  );
  assert(
    midnightSegments.segments.length === 3 &&
      midnightSegments.segments[0].targetDate === '2026-11-23' &&
      midnightSegments.segments[0].timeSlot === 'Avond' &&
      midnightSegments.segments[1].targetDate === '2026-11-24' &&
      midnightSegments.segments[1].timeSlot === 'Nacht',
    'Segmentatie splitst exact op Amsterdamse middernacht en tijdvakgrens'
  );

  const autumnDstSegments = segmentPrognosisInterval(
    '2026-10-25T01:30:00+02:00',
    '2026-10-25T02:30:00+01:00',
    [
      '2026-10-24T23:00:00.000Z',
      '2026-10-25T00:00:00.000Z',
      '2026-10-25T01:00:00.000Z',
    ].map((time) => ({ ...intervalForecasts[0], time }))
  );
  assert(
    autumnDstSegments.totalDurationMinutes === 120 &&
      autumnDstSegments.segments.length === 3 &&
      autumnDstSegments.segments.every((segment) => segment.targetDate === '2026-10-25' && segment.timeSlot === 'Nacht'),
    'Herfst-DST telt beide absolute 02:00-uren en behoudt twee uur werkelijke duur'
  );

  const springDstSegments = segmentPrognosisInterval(
    '2026-03-29T01:30:00+01:00',
    '2026-03-29T03:30:00+02:00',
    [
      '2026-03-29T00:00:00.000Z',
      '2026-03-29T01:00:00.000Z',
    ].map((time) => ({ ...intervalForecasts[0], time }))
  );
  assert(
    springDstSegments.totalDurationMinutes === 60 &&
      springDstSegments.segments.length === 2 &&
      springDstSegments.segments.every((segment) => segment.targetDate === '2026-03-29'),
    'Lente-DST volgt elapsed tijd en slaat het niet-bestaande lokale 02:00 over'
  );

  const unknownInterval = segmentPrognosisInterval(
    '2026-11-23T09:30:00+01:00',
    null,
    intervalForecasts
  );
  assert(
    unknownInterval.status === 'unknown_end' &&
      unknownInterval.segments.length === 0 &&
      unknownInterval.totalDurationMinutes === null &&
      unknownInterval.coverageRatio === null,
    'Onbekende eindtijd levert geen segmenten, duur of gefabriceerde dekking op'
  );
  const invalidInterval = segmentPrognosisInterval(
    '2026-11-23T12:00:00+01:00',
    '2026-11-23T11:00:00+01:00',
    intervalForecasts
  );
  assert(
    invalidInterval.status === 'invalid_interval' && invalidInterval.segments.length === 0,
    'Ongeldig interval wordt veilig geweigerd zonder segmenten'
  );

  const duplicateForecastHour = segmentPrognosisInterval(
    '2026-11-23T09:30:00+01:00',
    '2026-11-23T12:15:00+01:00',
    [...intervalForecasts, { ...intervalForecasts[1] }]
  );
  assert(
    duplicateForecastHour.status === 'partial' &&
      duplicateForecastHour.segments.some((segment) => !segment.weatherAvailable),
    'Dubbele forecasttijdstempels worden ambigu behandeld als ontbrekende data'
  );
  const overlongInterval = segmentPrognosisInterval(
    '2026-11-23T09:30:00+01:00',
    '2026-11-24T09:31:00+01:00',
    intervalForecasts
  );
  assert(
    overlongInterval.status === 'invalid_interval' && overlongInterval.segments.length === 0,
    'Segmentatie accepteert geen sessie langer dan 24 verstreken uren'
  );

  await db.delete();
  console.log(`Session snapshot commit tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch(async (error) => {
  console.error(error);
  try { await db.delete(); } catch {}
  process.exit(1);
});
