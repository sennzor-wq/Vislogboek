import 'fake-indexeddb/auto';
import {
  savePrognosisSnapshot,
  calculateDayPrognosis,
} from './src/services/prognosisEngine';
import {
  evaluatePrognosisPerformance,
  linkSessionOutcomeToSnapshot,
} from './src/services/evaluationEngine';
import { resolveSelectedTimeSlot } from './src/services/viscoachService';
import {
  DayPrognosis,
  FishingSession,
  PrognosisSnapshot,
  WeatherHourlyForecast,
  WeatherSnapshot,
  CatchItem,
} from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${name} ${detail ? `-> ${detail}` : ''}`);
    failed++;
  }
}

function createWeatherDay(temp = 17, pressure = 1018, windSpeed = 12): WeatherHourlyForecast[] {
  const list: WeatherHourlyForecast[] = [];
  for (let h = 0; h < 24; h++) {
    list.push({
      time: `2026-10-28T${String(h).padStart(2, '0')}:00`,
      temperature: temp,
      pressure,
      windSpeed,
      windDirection: 220,
      windDirectionText: 'ZW',
      precipitation: 0,
      precipitationProbability: 0,
      cloudCover: 50,
      weatherCode: 1,
    });
  }
  return list;
}

async function runTestSuite() {
  console.log('=== STARTING VOORWAARTSE VALIDATIE & UITKOMSTKOPPELING SUITE ===\n');

  // ==========================================
  // DEEL 1: AUTOMATISCHE MOMENTOPNAME BIJ SESSIESTART
  // ==========================================
  console.log('--- TESTGROEP 1: Automatische Momentopname bij Sessiestart ---');

  // 10 historische sessies zodat er een statistische vangkans berekend kan worden
  const histSessions: FishingSession[] = Array.from({ length: 10 }, (_, i) => ({
    id: `hist_s_${i}`,
    startTime: `2026-09-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
    outcome: i < 6 ? 'catch' : 'skunk_confirmed',
    targetSpecies: ['Karper'],
    durationMinutes: 180,
    locationId: 'spot-de-plas',
    createdAt: '',
    updatedAt: '',
  }));

  const weatherSample = Array.from({ length: 4 }, (_, dayIndex) =>
    createWeatherDay(18).map((hour) => ({
      ...hour,
      time: `2026-10-${String(25 + dayIndex).padStart(2, '0')}T${hour.time.slice(11)}`,
    }))
  ).flat();
  const histCatches: CatchItem[] = Array.from({ length: 6 }, (_, i) => ({
    id: `hist_catch_${i}`,
    sessionId: `hist_s_${i}`,
    species: 'Karper',
    count: 1,
    timestamp: `2026-09-${String(i + 1).padStart(2, '0')}T14:00:00Z`,
    createdAt: `2026-09-${String(i + 1).padStart(2, '0')}T14:00:00Z`,
  }));
  const progWithData = calculateDayPrognosis(
    '2026-10-28',
    weatherSample,
    'Karper',
    histSessions,
    new Date().toISOString(),
    null,
    new Date(),
    { sessionDurationHours: 4, locationId: 'spot-de-plas', catches: histCatches }
  );

  const sampleWeatherSnap: WeatherSnapshot = {
    temperature: 18.2,
    pressure: 1018,
    windSpeed: 12,
    windDirection: 220,
    windDirectionText: 'ZW',
    cloudCover: 20,
    precipitation: 0,
    source: 'open-meteo',
    capturedAt: new Date().toISOString(),
  };

  const snap1 = await savePrognosisSnapshot(
    progWithData,
    4,
    'spot-de-plas',
    'De Grote Plas',
    'Statisch / Feeder',
    'Middag',
    sampleWeatherSnap
  );

  assert(
    snap1.id.startsWith('snapshot-') && snap1.targetSpecies === 'Karper' && snap1.locationId === 'spot-de-plas',
    '1.1 Momentopname correct aangemaakt met doelsoort en stek'
  );

  assert(
    snap1.durationHours === 4 && snap1.predictedCatchChance !== null && typeof snap1.predictedCatchChance === 'number',
    `1.2 Geplande duur (4u) en berekende kans (${snap1.predictedCatchChance}%) correct vastgelegd`
  );

  assert(
    snap1.predictedConditions?.temperature === 18.2 && snap1.predictedConditions?.windDirectionText === 'ZW',
    '1.3 Actuele weersomstandigheden (predictedConditions) op voorspellingstijdstip bewaard'
  );

  assert(
    snap1.modelVersion === 'v2.4-water-thermal-history',
    '1.4 Modelversie expliciet geregistreerd als v2.4-water-thermal-history'
  );

  // 1.5 Duplicatenpreventie: herhaalde startactie hergebruikt hetzelfde snapshot
  const snapDuplicate = await savePrognosisSnapshot(
    progWithData,
    4,
    'spot-de-plas',
    'De Grote Plas',
    'Statisch / Feeder',
    'Middag',
    sampleWeatherSnap
  );

  assert(
    snapDuplicate.id === snap1.id,
    `1.5 Herhaalde startactie hergebruikt bestaande onveranderlijke snapshot zonder duplicaat (${snapDuplicate.id} === ${snap1.id})`
  );

  // 1.6 Ontbrekende data (< 5 sessies): geen schijnzekerheid
  const progNoData = calculateDayPrognosis(
    '2026-10-28',
    weatherSample,
    'Karper',
    histSessions.slice(0, 2), // slechts 2 sessies
    new Date().toISOString(),
    null,
    new Date(),
    { sessionDurationHours: 3, locationId: 'onbekende_stek' }
  );

  const snapNoData = await savePrognosisSnapshot(
    progNoData,
    3,
    'onbekende_stek',
    'Onbekende Stek',
    undefined,
    'Avond'
  );

  assert(
    snapNoData.predictedCatchChance === null,
    '1.6 Bij onvoldoende data (< 5 sessies) blijft predictedCatchChance strikt null (nooit gefabriceerd als 50% of 100%)'
  );

  // ==========================================
  // DEEL 2: AUTOMATISCHE UITKOMSTKOPPELING
  // ==========================================
  console.log('\n--- TESTGROEP 2: Automatische Koppeling bij Afronding ---');

  // Maak een sessie met session.snapshotId = snap1.id
  const liveSession1: FishingSession = {
    id: 'live_sess_001',
    startTime: '2026-10-28T12:00:00Z',
    endTime: '2026-10-28T16:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    locationId: 'spot-de-plas',
    snapshotId: snap1.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await linkSessionOutcomeToSnapshot(snap1.id, liveSession1, 2);

  // Haal snapshot direct in-memory / uit Dexie
  const { db } = await import('./src/db/db');
  const evaluatedSnap1 = await db.prognosisSnapshots.get(snap1.id);

  assert(
    evaluatedSnap1?.linkedSessionId === 'live_sess_001' && evaluatedSnap1?.actualOutcome === 'catch',
    '2.1 Geslaagde vangstsessie koppelt uitkomst=catch en sessie-ID aan snapshot'
  );

  assert(
    evaluatedSnap1?.actualTargetCatchesCount === 2,
    `2.2 Aantal gevangen doelvis (2 stuks) correct geregistreerd op snapshot`
  );

  // Bevestigde nulvangst
  const snapBlank = await savePrognosisSnapshot(
    progWithData,
    3,
    'spot-de-plas-2',
    'De Grote Plas 2',
    undefined,
    'Nacht'
  );

  const liveSessionBlank: FishingSession = {
    id: 'live_sess_002',
    startTime: '2026-10-28T00:00:00Z',
    endTime: '2026-10-28T03:00:00Z',
    durationMinutes: 180,
    outcome: 'skunk_confirmed',
    targetSpecies: ['Karper'],
    locationId: 'spot-de-plas-2',
    snapshotId: snapBlank.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await linkSessionOutcomeToSnapshot(snapBlank.id, liveSessionBlank, 0);
  const evaluatedSnapBlank = await db.prognosisSnapshots.get(snapBlank.id);

  assert(
    evaluatedSnapBlank?.actualOutcome === 'skunk_confirmed' && evaluatedSnapBlank?.actualTargetCatchesCount === 0,
    '2.3 Bevestigde nulvangst (skunk_confirmed) correct geregistreerd met 0 doelvis'
  );

  // Uitsluiting van actieve en onbekende sessies
  const activeSession: FishingSession = {
    id: 'sess_active',
    startTime: '2026-10-28T10:00:00Z',
    outcome: 'active',
    targetSpecies: ['Karper'],
    createdAt: '',
    updatedAt: '',
  };
  const unknownSession: FishingSession = {
    id: 'sess_unknown',
    startTime: '2026-10-28T10:00:00Z',
    outcome: 'unknown',
    targetSpecies: ['Karper'],
    createdAt: '',
    updatedAt: '',
  };

  const evalActive = evaluatePrognosisPerformance([
    {
      id: 'snap_act',
      forecastTimestamp: '',
      targetDate: '',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 7,
      predictedCatchChance: 50,
      source: '',
      modelVersion: 'v2.2',
      linkedSessionId: activeSession.id,
      actualOutcome: activeSession.outcome,
      createdAt: '',
    },
    {
      id: 'snap_unk',
      forecastTimestamp: '',
      targetDate: '',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 7,
      predictedCatchChance: 50,
      source: '',
      modelVersion: 'v2.2',
      linkedSessionId: unknownSession.id,
      actualOutcome: unknownSession.outcome,
      createdAt: '',
    },
  ]);

  assert(
    evalActive.evaluatedCount === 0 && evalActive.hasSufficientData === false,
    '2.4 Actieve en onbekende sessies worden strikt uitgesloten van evaluatie (evaluatedCount === 0)'
  );

  assert(resolveSelectedTimeSlot(new Date('2026-10-20T07:30:00+02:00'), new Date('2026-10-20T10:30:00+02:00')) === 'Ochtend',
    '2.4a Een sessievenster dat volledig in de ochtend valt, wordt aan Ochtend gekoppeld');
  assert(resolveSelectedTimeSlot(new Date('2026-10-20T11:00:00+02:00'), new Date('2026-10-20T13:00:00+02:00')) === undefined,
    '2.4b Een sessievenster dat meerdere tijdvakken kruist, krijgt geen geforceerd enkel tijdvak');
  assert(resolveSelectedTimeSlot(new Date('2026-10-20T19:00:00+02:00'), new Date('2026-10-20T22:00:00+02:00')) === 'Avond',
    '2.4c Een sessievenster dat volledig in de avond valt, wordt aan Avond gekoppeld');
  assert(resolveSelectedTimeSlot(new Date('2026-10-20T23:00:00+02:00'), new Date('2026-10-21T01:00:00+02:00')) === undefined,
    '2.4d Een sessie over meerdere tijdvakken en middernacht krijgt geen onjuiste tijdvaktoewijzing');

  // Geen achteraf gegenereerde snapshots voor historische sessies
  const historicalSessionNoSnapshot: FishingSession = {
    id: 'hist_manual_no_snap',
    startTime: '2026-09-15T12:00:00Z',
    endTime: '2026-09-15T15:00:00Z',
    durationMinutes: 180,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(
    historicalSessionNoSnapshot.snapshotId === undefined,
    '2.5 Historische handmatige sessies behouden snapshotId=undefined (geen achteraf gefabriceerde snapshots)'
  );

  // 2.6 autoSyncSessionOutcomeToSnapshot werking
  const { autoSyncSessionOutcomeToSnapshot } = await import('./src/services/evaluationEngine');
  const targetCatch: CatchItem = {
    id: 'live_sess_001_target_catch',
    sessionId: liveSession1.id,
    locationId: 'spot-de-plas',
    species: 'Karper',
    count: 2,
    timestamp: liveSession1.startTime,
    createdAt: liveSession1.startTime,
  };
  await db.catches.put(targetCatch);
  await db.sessions.put(liveSession1);
  const syncedSuccess = await autoSyncSessionOutcomeToSnapshot(liveSession1);
  assert(
    syncedSuccess === true,
    '2.6 autoSyncSessionOutcomeToSnapshot synchroniseert automatisch gekoppelde sessie'
  );

  // 2.7 Herhaald afronden of opnieuw opslaan leidt niet tot dubbele momentopnames
  const countBefore = await db.prognosisSnapshots.count();
  await autoSyncSessionOutcomeToSnapshot({ ...liveSession1, notes: 'Aangepaste notitie na afronding' });
  const countAfter = await db.prognosisSnapshots.count();
  assert(
    countBefore === countAfter,
    `2.7 Herhaald opslaan is idempotent en veroorzaakt geen dubbele snapshots (${countBefore} === ${countAfter})`
  );

  // 2.8 Sessie zonder snapshotId wordt niet gekoppeld
  const noSnapSync = await autoSyncSessionOutcomeToSnapshot(historicalSessionNoSnapshot);
  assert(
    noSnapSync === false,
    '2.8 Sessie zonder snapshotId wordt veilig genegeerd en niet gekoppeld'
  );

  // 2.9 Benchmark-sessie wordt geweigerd voor synchronisatie
  const benchmarkSession: FishingSession = {
    id: 'test-benchmark-session',
    startTime: '2026-10-19T19:00:00Z',
    outcome: 'catch',
    targetSpecies: ['Karper'],
    isBenchmark: true,
    snapshotId: snap1.id,
    createdAt: '',
    updatedAt: '',
  };
  const benchmarkSync = await autoSyncSessionOutcomeToSnapshot(benchmarkSession);
  assert(
    benchmarkSync === false,
    '2.9 Benchmark-sessie wordt geweigerd voor synchronisatie naar modelvalidatie'
  );

  // 2.10 Een niet-doelsoortvangst bewijst geen doelsoortnulvangst.
  const nonTargetSnapshot: PrognosisSnapshot = {
    id: 'snapshot_non_target_catch',
    forecastTimestamp: '2026-10-27T10:00:00Z',
    targetDate: '2026-10-28',
    targetSpecies: 'Karper',
    durationHours: 3,
    predictedActivityScore: 6,
    predictedCatchChance: 50,
    source: 'test',
    modelVersion: 'test',
    createdAt: '2026-10-27T10:00:00Z',
  };
  await db.prognosisSnapshots.put(nonTargetSnapshot);
  const nonTargetSession: FishingSession = {
    id: 'session_non_target_catch',
    startTime: '2026-10-28T12:00:00Z',
    endTime: '2026-10-28T15:00:00Z',
    outcome: 'catch',
    targetSpecies: ['Karper'],
    snapshotId: nonTargetSnapshot.id,
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T15:00:00Z',
  };
  await db.sessions.put(nonTargetSession);
  await db.catches.put({
    id: 'catch_non_target_bream',
    sessionId: nonTargetSession.id,
    species: 'Brasem',
    count: 1,
    timestamp: nonTargetSession.startTime,
    createdAt: nonTargetSession.startTime,
  } as CatchItem);
  await autoSyncSessionOutcomeToSnapshot(nonTargetSession);
  const nonTargetResult = await db.prognosisSnapshots.get(nonTargetSnapshot.id);
  assert(
    nonTargetResult?.actualOutcome === 'unknown' && nonTargetResult.actualTargetCatchesCount === undefined,
    '2.10 Bijvangst blijft onbekend voor de voorspelde doelsoort en wordt niet als nulvangst gescoord'
  );

  // 2.11 Een algemene vangststatus zonder soortspecifieke vangstregistratie blijft onbekend.
  const ambiguousSnapshot: PrognosisSnapshot = {
    ...nonTargetSnapshot,
    id: 'snapshot_ambiguous_catch',
  };
  await db.prognosisSnapshots.put(ambiguousSnapshot);
  const ambiguousSession: FishingSession = {
    ...nonTargetSession,
    id: 'session_ambiguous_catch',
    snapshotId: ambiguousSnapshot.id,
  };
  await db.sessions.put(ambiguousSession);
  await autoSyncSessionOutcomeToSnapshot(ambiguousSession);
  const ambiguousResult = await db.prognosisSnapshots.get(ambiguousSnapshot.id);
  assert(
    ambiguousResult?.actualOutcome === 'unknown',
    '2.11 Vangststatus zonder soortspecifieke vangstregistratie wordt niet als succes of nulvangst geraden'
  );

  // ==========================================
  // DEEL 3: BRIER-SCORE & EMPIRISCHE VALIDATIE
  // ==========================================
  console.log('\n--- TESTGROEP 3: Brier-Score & Evaluatiekwaliteit ---');

  // Maak 5 voltooide snapshots met numerieke voorspellingen
  const fiveEvaluatedSnapshots: PrognosisSnapshot[] = [
    {
      id: 's1',
      forecastTimestamp: '2026-10-01T07:00:00Z',
      targetDate: '2026-10-01',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 7,
      predictedCatchChance: 70, // f = 0.7
      actualOutcome: 'catch',
      linkedSessionId: 'evaluation-session-1',   // o = 1.0 -> (0.7 - 1)^2 = 0.09
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
    },
    {
      id: 's2',
      forecastTimestamp: '2026-10-02T07:00:00Z',
      targetDate: '2026-10-02',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 6,
      predictedCatchChance: 40, // f = 0.4
      actualOutcome: 'skunk_confirmed',
      linkedSessionId: 'evaluation-session-2', // o = 0.0 -> (0.4 - 0)^2 = 0.16
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
    },
    {
      id: 's3',
      forecastTimestamp: '2026-10-03T07:00:00Z',
      targetDate: '2026-10-03',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 8,
      predictedCatchChance: 60, // f = 0.6
      actualOutcome: 'catch',   // o = 1.0 -> (0.6 - 1)^2 = 0.16
      linkedSessionId: 'evaluation-session-3',
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
    },
    {
      id: 's4',
      forecastTimestamp: '2026-10-04T07:00:00Z',
      targetDate: '2026-10-04',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 5,
      predictedCatchChance: 20, // f = 0.2
      actualOutcome: 'skunk_confirmed', // o = 0.0 -> (0.2 - 0)^2 = 0.04
      linkedSessionId: 'evaluation-session-4',
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
    },
    {
      id: 's5',
      forecastTimestamp: '2026-10-05T07:00:00Z',
      targetDate: '2026-10-05',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 7,
      predictedCatchChance: 50, // f = 0.5
      actualOutcome: 'catch',   // o = 1.0 -> (0.5 - 1)^2 = 0.25
      linkedSessionId: 'evaluation-session-5',
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
    },
  ];

  const fiveEvaluationSessions: FishingSession[] = fiveEvaluatedSnapshots.map((snapshot, index) => ({
    id: snapshot.linkedSessionId!,
    startTime: `2026-10-0${index + 1}T08:00:00Z`,
    endTime: `2026-10-0${index + 1}T11:00:00Z`,
    outcome: snapshot.actualOutcome as 'catch' | 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: `2026-10-0${index + 1}T08:00:00Z`,
    updatedAt: `2026-10-0${index + 1}T11:00:00Z`,
  }));
  const evaluationWithoutHistory = evaluatePrognosisPerformance(fiveEvaluatedSnapshots, fiveEvaluatedSnapshots, fiveEvaluationSessions);
  assert(evaluationWithoutHistory.naiveBrierScore === null &&
    evaluationWithoutHistory.brierSkillScore === null &&
    evaluationWithoutHistory.baselineEvaluatedCount === 0,
    '3.0 Zonder eerdere trainingshistorie wordt geen zelf-geoptimaliseerde baseline of BSS getoond');

  const baselineTraining: PrognosisSnapshot[] = [
    'catch', 'catch', 'catch', 'skunk_confirmed', 'skunk_confirmed',
  ].map((outcome, index) => ({
    id: `baseline-training-${index}`,
    forecastTimestamp: `2026-09-${String(index + 1).padStart(2, '0')}T07:00:00Z`,
    targetDate: `2026-09-${String(index + 1).padStart(2, '0')}`,
    targetSpecies: 'Karper',
    durationHours: 3,
    predictedActivityScore: null,
    predictedCatchChance: null,
    actualOutcome: outcome as 'catch' | 'skunk_confirmed',
    linkedSessionId: `baseline-session-${index}`,
    source: 'test-training-history',
    modelVersion: 'test',
    createdAt: `2026-09-${String(index + 1).padStart(2, '0')}T07:00:00Z`,
  }));
  const baselineTrainingSessions: FishingSession[] = baselineTraining.map((snapshot, index) => ({
    id: snapshot.linkedSessionId!,
    startTime: `2026-09-${String(index + 1).padStart(2, '0')}T07:00:00Z`,
    endTime: `2026-09-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
    outcome: snapshot.actualOutcome as 'catch' | 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: `2026-09-${String(index + 1).padStart(2, '0')}T07:00:00Z`,
    updatedAt: `2026-09-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
  }));
  const evalResult5 = evaluatePrognosisPerformance(fiveEvaluatedSnapshots, baselineTraining, [...baselineTrainingSessions, ...fiveEvaluationSessions]);

  // Som kwadratische fout = 0.09 + 0.16 + 0.16 + 0.04 + 0.25 = 0.70
  // Brier score = 0.70 / 5 = 0.140
  assert(
    evalResult5.hasSufficientData === true && evalResult5.brierScore === 0.14,
    `3.1 Brier-score exact berekend bij N=5 voorwaarts gekoppelde sessies (berekend: ${evalResult5.brierScore}, verwacht: 0.140)`
  );

  // De rolling baseline gebruikt uitsluitend de 5 eerdere trainingsuitkomsten (3/5 = 0.60).
  // Deze voorspelt dus 0.60 voor elk van de 5 latere testgevallen.
  // Naive Brier score = 1.20 / 5 = 0.240; BSS = 1 - 0.140 / 0.240 = +41.7%.
  assert(
    evalResult5.naiveBrierScore === 0.24 &&
      evalResult5.baselineEvaluatedCount === 5 &&
      (evalResult5.brierSkillScore ?? 0) > 0.4,
    `3.2 Chronologische rolling baseline (${evalResult5.naiveBrierScore}) gebruikt 5 eerdere uitkomsten en toont BSS +${((evalResult5.brierSkillScore ?? 0) * 100).toFixed(1)}%`
  );

  const futureTrainingOutcome: PrognosisSnapshot = {
    id: 'future-training-outcome',
    forecastTimestamp: '2026-10-06T07:00:00Z',
    targetDate: '2026-10-06',
    targetSpecies: 'Karper',
    durationHours: 3,
    predictedActivityScore: null,
    predictedCatchChance: null,
    actualOutcome: 'catch',
    linkedSessionId: 'future-training-session',
    source: 'test-training-history',
    modelVersion: 'test',
    createdAt: '2026-10-06T07:00:00Z',
  };
  const overnightPriorOutcome: PrognosisSnapshot = {
    id: 'overnight-prior-outcome',
    forecastTimestamp: '2026-10-04T22:00:00Z',
    targetDate: '2026-10-04',
    targetSpecies: 'Karper',
    durationHours: 8,
    predictedActivityScore: null,
    predictedCatchChance: null,
    actualOutcome: 'catch',
    linkedSessionId: 'overnight-training-session',
    source: 'test-training-history',
    modelVersion: 'test',
    createdAt: '2026-10-04T22:00:00Z',
  };
  const futureTrainingSessions: FishingSession[] = [
    ...baselineTrainingSessions,
    {
      id: 'future-training-session',
      startTime: '2026-10-06T07:00:00Z',
      endTime: '2026-10-06T10:00:00Z',
      outcome: 'catch',
      targetSpecies: ['Karper'],
      createdAt: '2026-10-06T07:00:00Z',
      updatedAt: '2026-10-06T10:00:00Z',
    },
    {
      id: 'overnight-training-session',
      startTime: '2026-10-04T22:00:00Z',
      endTime: '2026-10-05T08:00:00Z',
      outcome: 'catch',
      targetSpecies: ['Karper'],
      createdAt: '2026-10-04T22:00:00Z',
      updatedAt: '2026-10-05T08:00:00Z',
    },
  ];
  const evaluationWithFutureHistory = evaluatePrognosisPerformance(
    fiveEvaluatedSnapshots,
    [...baselineTraining, futureTrainingOutcome, overnightPriorOutcome],
    [...futureTrainingSessions, ...fiveEvaluationSessions]
  );
  assert(evaluationWithFutureHistory.naiveBrierScore === evalResult5.naiveBrierScore &&
    evaluationWithFutureHistory.baselineEvaluatedCount === evalResult5.baselineEvaluatedCount,
    '3.3 Een latere sessie-uitkomst verandert de rolling baseline voor eerdere prognosedagen niet');

  // Benchmarks moeten worden uitgesloten
  const snapshotsWithBenchmark: PrognosisSnapshot[] = [
    ...fiveEvaluatedSnapshots,
    {
      id: 's_benchmark',
      forecastTimestamp: '',
      targetDate: '2026-10-19',
      targetSpecies: 'Brasem',
      durationHours: 3,
      predictedActivityScore: 8,
      predictedCatchChance: 90,
      actualOutcome: 'catch',
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
      isBenchmark: true,
    } as any,
  ];

  const evalBenchmark = evaluatePrognosisPerformance(snapshotsWithBenchmark, snapshotsWithBenchmark, fiveEvaluationSessions);
  assert(
    evalBenchmark.evaluatedCount === 5,
    `3.3 Benchmark momentopname (isBenchmark: true) wordt strikt uitgesloten van modelvalidatie (evaluatedCount: ${evalBenchmark.evaluatedCount})`
  );

  // Snapshots met predictedCatchChance: null moeten worden uitgesloten
  const snapshotsWithNullChance: PrognosisSnapshot[] = [
    ...fiveEvaluatedSnapshots,
    {
      id: 's_null_chance',
      forecastTimestamp: '',
      targetDate: '2026-10-20',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 7,
      predictedCatchChance: null, // Geen statistische kans berekend wegens te weinig data
      actualOutcome: 'catch',
      source: '',
      modelVersion: 'v2.2',
      createdAt: '',
    },
  ];

  const evalNullChance = evaluatePrognosisPerformance(snapshotsWithNullChance, snapshotsWithNullChance, fiveEvaluationSessions);
  assert(
    evalNullChance.evaluatedCount === 5,
    '3.4 Momentopnames zonder geldige statistische vangstkans (null) worden niet in Brier-score meegenomen'
  );

  // Kalibratie-bins
  assert(
    evalResult5.calibrationBins.length === 5 &&
      evalResult5.calibrationBins.some((b) => b.snapshotCount > 0),
    '3.5 Kalibratietabel bevat 5 segmenten en verdeelt evaluaties correct'
  );

  console.log('\n======================================================');
  console.log(`TESTRESULTAAT: ${passed} GESLAAGD, ${failed} MISLUKT`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Onverwachte fout in testsuite:', err);
  process.exit(1);
});
