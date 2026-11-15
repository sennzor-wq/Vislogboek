import 'fake-indexeddb/auto';
import { db, initializeDatabase, deleteSessionSafely, LOKKERSHOEK_PIER_ID } from './src/db/db';
import { autoSyncSessionOutcomeToSnapshot, evaluatePrognosisPerformance } from './src/services/evaluationEngine';
import { FishingSession, PrognosisSnapshot, CatchItem, WeatherSnapshot } from './src/types';

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

async function runBrierIntegrationTest() {
  console.log('\n======================================================================');
  console.log('INTEGRATIETEST: MODELVALIDATIE & EMPIRISCHE BRIER-SCORE (v2.2)');
  console.log('7 Vooraf vastgelegde voorspellingen gekoppeld aan 7 afgeronde sessies');
  console.log('======================================================================\n');

  // 0. Initialiseer database en leg initiële stand vast
  await initializeDatabase();
  const initialSessionCount = await db.sessions.count();
  const initialCatchCount = await db.catches.count();
  const initialSnapshotCount = await db.prognosisSnapshots.count();

  console.log(`Bestaande database records vóór test:`);
  console.log(`- Sessies: ${initialSessionCount}`);
  console.log(`- Vangsten: ${initialCatchCount}`);
  console.log(`- Prognosemomentopnames: ${initialSnapshotCount}\n`);

  // ====================================================================
  // STAP 1 & 2: MAAK EXACT 7 FICTIEVE TESTGEVALLEN MET VOORAF VASTGELEGDE KANSEN
  // EN REALISTISCHE FICTIEVE WEERSOMSTANDIGHEDEN VOOR LOKKERSHOEK
  // ====================================================================
  console.log('--- STAP 1 & 2: Registratie van 7 Onveranderlijke Voorspellingen ---');

  interface TestCaseDefinition {
    testNumber: number;
    predictedChance: number; // in % [0 - 100]
    expectedOutcome: 'catch' | 'skunk_confirmed';
    expectedSquaredError: number;
    weather: WeatherSnapshot;
    durationHours: number;
    startTime: string;
    endTime: string;
    caughtFishCount: number;
    caughtWeightKg?: number;
  }

  const testCases: TestCaseDefinition[] = [
    {
      testNumber: 1,
      predictedChance: 80, // 0,80
      expectedOutcome: 'catch',
      expectedSquaredError: 0.04, // (0.80 - 1.0)^2 = 0.04
      weather: {
        temperature: 19.5,
        pressure: 1016,
        windSpeed: 14,
        windDirection: 230,
        windDirectionText: 'ZW',
        cloudCover: 60,
        precipitation: 0.0,
        source: 'open-meteo',
        capturedAt: '2026-10-20T10:00:00Z',
      },
      durationHours: 4,
      startTime: '2026-10-20T10:00:00Z',
      endTime: '2026-10-20T14:00:00Z',
      caughtFishCount: 2,
      caughtWeightKg: 8.5,
    },
    {
      testNumber: 2,
      predictedChance: 70, // 0,70
      expectedOutcome: 'skunk_confirmed',
      expectedSquaredError: 0.49, // (0.70 - 0.0)^2 = 0.49
      weather: {
        temperature: 16.0,
        pressure: 1022,
        windSpeed: 18,
        windDirection: 270,
        windDirectionText: 'W',
        cloudCover: 85,
        precipitation: 0.5,
        source: 'open-meteo',
        capturedAt: '2026-10-21T09:00:00Z',
      },
      durationHours: 5,
      startTime: '2026-10-21T09:00:00Z',
      endTime: '2026-10-21T14:00:00Z',
      caughtFishCount: 0,
    },
    {
      testNumber: 3,
      predictedChance: 60, // 0,60
      expectedOutcome: 'catch',
      expectedSquaredError: 0.16, // (0.60 - 1.0)^2 = 0.16
      weather: {
        temperature: 14.5,
        pressure: 1012,
        windSpeed: 22,
        windDirection: 200,
        windDirectionText: 'ZZW',
        cloudCover: 90,
        precipitation: 1.2,
        source: 'open-meteo',
        capturedAt: '2026-10-22T13:00:00Z',
      },
      durationHours: 3,
      startTime: '2026-10-22T13:00:00Z',
      endTime: '2026-10-22T16:00:00Z',
      caughtFishCount: 1,
      caughtWeightKg: 11.2,
    },
    {
      testNumber: 4,
      predictedChance: 40, // 0,40
      expectedOutcome: 'skunk_confirmed',
      expectedSquaredError: 0.16, // (0.40 - 0.0)^2 = 0.16
      weather: {
        temperature: 10.2,
        pressure: 1028,
        windSpeed: 8,
        windDirection: 90,
        windDirectionText: 'O',
        cloudCover: 20,
        precipitation: 0.0,
        source: 'open-meteo',
        capturedAt: '2026-10-23T08:00:00Z',
      },
      durationHours: 4,
      startTime: '2026-10-23T08:00:00Z',
      endTime: '2026-10-23T12:00:00Z',
      caughtFishCount: 0,
    },
    {
      testNumber: 5,
      predictedChance: 30, // 0,30
      expectedOutcome: 'catch',
      expectedSquaredError: 0.49, // (0.30 - 1.0)^2 = 0.49
      weather: {
        temperature: 8.5,
        pressure: 1005,
        windSpeed: 28,
        windDirection: 315,
        windDirectionText: 'NW',
        cloudCover: 100,
        precipitation: 4.5,
        source: 'open-meteo',
        capturedAt: '2026-10-24T11:00:00Z',
      },
      durationHours: 6,
      startTime: '2026-10-24T11:00:00Z',
      endTime: '2026-10-24T17:00:00Z',
      caughtFishCount: 1,
      caughtWeightKg: 7.4,
    },
    {
      testNumber: 6,
      predictedChance: 20, // 0,20
      expectedOutcome: 'skunk_confirmed',
      expectedSquaredError: 0.04, // (0.20 - 0.0)^2 = 0.04
      weather: {
        temperature: 6.0,
        pressure: 1032,
        windSpeed: 12,
        windDirection: 45,
        windDirectionText: 'NO',
        cloudCover: 10,
        precipitation: 0.0,
        source: 'open-meteo',
        capturedAt: '2026-10-25T07:00:00Z',
      },
      durationHours: 3,
      startTime: '2026-10-25T07:00:00Z',
      endTime: '2026-10-25T10:00:00Z',
      caughtFishCount: 0,
    },
    {
      testNumber: 7,
      predictedChance: 50, // 0,50
      expectedOutcome: 'catch',
      expectedSquaredError: 0.25, // (0.50 - 1.0)^2 = 0.25
      weather: {
        temperature: 17.0,
        pressure: 1018,
        windSpeed: 15,
        windDirection: 180,
        windDirectionText: 'Z',
        cloudCover: 45,
        precipitation: 0.0,
        source: 'open-meteo',
        capturedAt: '2026-10-26T12:00:00Z',
      },
      durationHours: 4.5,
      startTime: '2026-10-26T12:00:00Z',
      endTime: '2026-10-26T16:30:00Z',
      caughtFishCount: 1,
      caughtWeightKg: 9.8,
    },
  ];

  // 1. Sla de 7 voorspellingsmomentopnames vooraf op in de database
  for (const tc of testCases) {
    const snapId = `test_brier_snap_${tc.testNumber}`;
    const snapshot: PrognosisSnapshot = {
      id: snapId,
      forecastTimestamp: new Date(new Date(tc.startTime).getTime() - 60 * 60 * 1000).toISOString(),
      targetDate: tc.startTime.slice(0, 10),
      targetSpecies: 'Karper',
      locationId: LOKKERSHOEK_PIER_ID,
      locationName: 'Lokkershoek Pier',
      durationHours: tc.durationHours,
      predictedActivityScore: Math.round(tc.predictedChance / 10),
      predictedCatchChance: tc.predictedChance,
      predictedConditions: tc.weather,
      source: 'test_integration',
      modelVersion: 'v2.2',
      createdAt: tc.weather.capturedAt,
    };
    await db.prognosisSnapshots.put(snapshot);
  }

  const createdSnapshots = await db.prognosisSnapshots
    .filter((s) => s.id.startsWith('test_brier_snap_'))
    .toArray();

  assert(
    createdSnapshots.length === 7,
    `1.1 Exact 7 fictieve momentopnames vooraf geregistreerd (aantal: ${createdSnapshots.length})`
  );

  // ====================================================================
  // STAP 3: AFRONDEN EN KOPPELEN VAN DE 7 SESSIES VIA PRODUCTIELOGICA
  // ====================================================================
  console.log('\n--- STAP 3: Vissessies Afronden en Koppelen via autoSyncSessionOutcomeToSnapshot ---');

  for (const tc of testCases) {
    const sessId = `test_brier_sess_${tc.testNumber}`;
    const snapId = `test_brier_snap_${tc.testNumber}`;

    // Maak de afgeronde sessie aan met de expliciete snapshotId koppeling
    const session: FishingSession = {
      id: sessId,
      locationId: LOKKERSHOEK_PIER_ID,
      locationName: 'Lokkershoek Pier',
      startTime: tc.startTime,
      endTime: tc.endTime,
      durationMinutes: Math.round(tc.durationHours * 60),
      outcome: tc.expectedOutcome,
      targetSpecies: ['Karper'],
      rodCount: 2,
      technique: 'Statisch / Karper',
      weatherSnapshot: tc.weather,
      snapshotId: snapId,
      createdAt: tc.startTime,
      updatedAt: tc.endTime,
    };
    await db.sessions.put(session);

    // Indien karper gevangen: registreer vangstitem(s) in db.catches
    if (tc.expectedOutcome === 'catch' && tc.caughtFishCount > 0) {
      const catchItem: CatchItem = {
        id: `test_brier_catch_${tc.testNumber}`,
        sessionId: sessId,
        locationId: LOKKERSHOEK_PIER_ID,
        species: 'Karper',
        count: tc.caughtFishCount,
        weightKg: tc.caughtWeightKg,
        timestamp: tc.startTime,
        bait: 'Boilie 20mm',
        technique: 'Statisch',
        createdAt: tc.startTime,
      };
      await db.catches.put(catchItem);
    }

    // Koppel de sessieuitkomst via de bestaande productiefunctie
    const syncResult = await autoSyncSessionOutcomeToSnapshot(session);
    assert(
      syncResult === true,
      `3.${tc.testNumber} Sessie ${tc.testNumber} (${tc.expectedOutcome}) succesvol gekoppeld aan snapshot via productielogica`
    );
  }

  // ====================================================================
  // STAP 4: CONTROLEER DE BRIER-SCORE EN INDIVIDUELE KWADRATISCHE FOUTEN
  // ====================================================================
  console.log('\n--- STAP 4: Berekening van Brier-score en Individuele Kwadratische Fouten ---');

  const linkedSnapshots = await db.prognosisSnapshots
    .filter((s) => s.id.startsWith('test_brier_snap_'))
    .toArray();

  // Controleer individuele kwadratische fout per testgeval
  let accumulatedSquaredError = 0;
  for (const tc of testCases) {
    const snap = linkedSnapshots.find((s) => s.id === `test_brier_snap_${tc.testNumber}`);
    assert(snap !== undefined, `Snap ${tc.testNumber} aanwezig in database`);
    assert(
      snap?.actualOutcome === tc.expectedOutcome,
      `Snap ${tc.testNumber} actualOutcome klopt (${snap?.actualOutcome} === ${tc.expectedOutcome})`
    );

    const f = (snap?.predictedCatchChance ?? 0) / 100;
    const o = snap?.actualOutcome === 'catch' ? 1.0 : 0.0;
    const individualError = Math.round(Math.pow(f - o, 2) * 10000) / 10000;
    accumulatedSquaredError += individualError;

    assert(
      Math.abs(individualError - tc.expectedSquaredError) < 1e-4,
      `4.${tc.testNumber} Test ${tc.testNumber}: Voorspeld=${f.toFixed(2)}, Werkelijk=${o} -> Kwadratische fout = ${individualError.toFixed(4)} (Verwacht: ${tc.expectedSquaredError.toFixed(4)})`
    );
  }

  const expectedTotalSquaredError = 1.63;
  assert(
    Math.abs(accumulatedSquaredError - expectedTotalSquaredError) < 1e-4,
    `4.8 Totale som van kwadratische fouten = ${accumulatedSquaredError.toFixed(2)} (Verwacht: 1.63)`
  );

  // Gescheiden trainingshistorie van vóór de testperiode. Deze uitkomsten worden
  // alleen gebruikt om de rolling baseline te bepalen en niet als testvoorspellingen gescoord.
  const baselineTrainingSnapshots: PrognosisSnapshot[] = [
    'catch', 'catch', 'catch', 'catch', 'skunk_confirmed', 'skunk_confirmed', 'skunk_confirmed',
  ].map((outcome, index) => ({
    id: `baseline-training-${index + 1}`,
    forecastTimestamp: `2026-10-${String(10 + index).padStart(2, '0')}T07:00:00Z`,
    targetDate: `2026-10-${String(10 + index).padStart(2, '0')}`,
    targetSpecies: 'Karper',
    durationHours: 4,
    predictedActivityScore: null,
    predictedCatchChance: null,
    actualOutcome: outcome as 'catch' | 'skunk_confirmed',
    linkedSessionId: `baseline-session-${index + 1}`,
    source: 'test-training-history',
    modelVersion: 'test',
    createdAt: `2026-10-${String(10 + index).padStart(2, '0')}T07:00:00Z`,
  }));
  const baselineTrainingSessions: FishingSession[] = baselineTrainingSnapshots.map((snapshot, index) => ({
    id: snapshot.linkedSessionId!,
    startTime: `2026-10-${String(10 + index).padStart(2, '0')}T07:00:00Z`,
    endTime: `2026-10-${String(10 + index).padStart(2, '0')}T10:00:00Z`,
    outcome: snapshot.actualOutcome as 'catch' | 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: `2026-10-${String(10 + index).padStart(2, '0')}T07:00:00Z`,
    updatedAt: `2026-10-${String(10 + index).padStart(2, '0')}T10:00:00Z`,
  }));
  const recordedSessions = await db.sessions.toArray();
  const evalResult = evaluatePrognosisPerformance(linkedSnapshots, baselineTrainingSnapshots, [...baselineTrainingSessions, ...recordedSessions]);

  const fiveSessionResult = evaluatePrognosisPerformance(
    linkedSnapshots.slice(0, 5),
    baselineTrainingSnapshots,
    [...baselineTrainingSessions, ...recordedSessions]
  );
  assert(fiveSessionResult.evaluatedCount === 5 && fiveSessionResult.hasSufficientData === true &&
    fiveSessionResult.statusMessage.includes('Voorlopige indicatie') &&
    fiveSessionResult.disclaimers.some((item) => item.startsWith('VOORLOPIG:')),
    'Precies vijf sessies tonen alleen een expliciet voorlopige Brier-indicatie');

  const duplicateAndOrphanResult = evaluatePrognosisPerformance(
    [
      ...linkedSnapshots,
      { ...linkedSnapshots[0], id: 'test_brier_duplicate_same_session' },
      { ...linkedSnapshots[0], id: 'test_brier_orphan', linkedSessionId: undefined },
    ],
    baselineTrainingSnapshots,
    [...baselineTrainingSessions, ...recordedSessions]
  );
  assert(duplicateAndOrphanResult.evaluatedCount === 7,
    'Brier-evaluatie telt dezelfde sessie/soort maar één keer en sluit een niet-gekoppelde snapshot uit');
  assert(duplicateAndOrphanResult.disclaimers.some((item) => item.includes('1 dubbele')) &&
    duplicateAndOrphanResult.disclaimers.some((item) => item.includes('1 momentopname')),
    'Brier-evaluatie rapporteert uitgesloten duplicaten en niet-gekoppelde snapshots');

  // Gemiddelde Brier-score = 1.63 / 7 ≈ 0.2329 (in EvaluationResult afgerond op 3 decimalen: 0.233)
  const expectedBrierScore = 1.63 / 7;
  assert(
    evalResult.brierScore !== null && Math.abs(evalResult.brierScore - expectedBrierScore) < 1e-3,
    `4.9 Gemiddelde Brier-score = ${evalResult.brierScore?.toFixed(4)} (Verwacht: ${(1.63 / 7).toFixed(4)} ≈ 0.2329, afgerond: 0.233)`
  );

  // Rolling baseline: 4 vangsten uit 7 eerdere trainingssessies -> basiskans = 4/7 ≈ 0.5714.
  // De 7 testuitkomsten worden niet gebruikt om hun eigen referentiekans te bepalen.
  // Naive Brier Score = 4 * (4/7 - 1)^2 / 7 + 3 * (4/7 - 0)^2 / 7 = 12 / 49 ≈ 0.2449
  const expectedNaiveBS = 12 / 49;
  assert(
    evalResult.naiveBrierScore !== null &&
      evalResult.baselineEvaluatedCount === 7 &&
      Math.abs(evalResult.naiveBrierScore - expectedNaiveBS) < 1e-3,
    `4.10 Chronologische rolling baseline BS_naive = ${evalResult.naiveBrierScore?.toFixed(4)} op ${evalResult.baselineEvaluatedCount} testgevallen (Verwacht: ${(12 / 49).toFixed(4)} ≈ 0.2449)`
  );

  // Brier Skill Score: 1 - (BS / BS_naive) = 1 - ( (1.63/7) / (12/49) ) = 1 - 0.950833... = +0.049 (+4.9%)
  assert(
    evalResult.brierSkillScore !== null && Math.abs(evalResult.brierSkillScore - 0.049) < 1e-3,
    `4.11 Brier Skill Score BSS = +${((evalResult.brierSkillScore ?? 0) * 100).toFixed(1)}% (+0.049) (Verwacht: +4.9%)`
  );

  // ====================================================================
  // STAP 5: CONTROLEER VALIDATIE-INDICATOREN & VOLDOENDE DATA
  // ====================================================================
  console.log('\n--- STAP 5: Controle van Validatiestatus & Drempels ---');

  assert(
    evalResult.evaluatedCount === 7,
    `5.1 Evaluatieteller toont exact 7 geldige waarnemingen (evaluatedCount: ${evalResult.evaluatedCount})`
  );
  assert(
    evalResult.pendingCount === 0,
    `5.2 Geen openstaande/ongekoppelde momentopnames in testset (pendingCount: ${evalResult.pendingCount})`
  );
  assert(
    evalResult.hasSufficientData === true,
    '5.3 hasSufficientData is true (N=7 >= 5 drempel bereikt)'
  );
  assert(
    !evalResult.statusMessage.includes('Nog niet gevalideerd'),
    `5.4 Melding dat data onvoldoende is wegens N < 5 is verdwenen (Status: "${evalResult.statusMessage}")`
  );
  assert(
    evalResult.statusMessage.startsWith('Voorlopige indicatie') &&
      evalResult.disclaimers.some((item) => item.startsWith('VOORLOPIG:')),
    'Een berekende Brier-score blijft expliciet voorlopig, ook boven de technische minimumgrens'
  );
  assert(
    evalResult.calibrationBins.length === 5,
    '5.5 Kalibratietabel bevat alle 5 kanssegmenten'
  );

  // De productie-database bevat geen automatisch geladen benchmarkavond meer.

  // ====================================================================
  // STAP 6: OPVANGEN EN VEILIG VERWIJDEREN VAN ALLE TESTGEGEVENS
  // ====================================================================
  console.log('\n--- STAP 6: Schoonmaken van Testdata & Verificatie van Database-integriteit ---');

  // Verwijder alle testgevallen via de productiefunctie deleteSessionSafely
  for (const tc of testCases) {
    const sessId = `test_brier_sess_${tc.testNumber}`;
    await deleteSessionSafely(sessId);
  }

  // Verifieer dat alle test-records volledig verdwenen zijn
  const remainingTestSessions = await db.sessions
    .filter((s) => s.id.startsWith('test_brier_'))
    .count();
  const remainingTestCatches = await db.catches
    .filter((c) => c.id.startsWith('test_brier_'))
    .count();
  const remainingTestSnapshots = await db.prognosisSnapshots
    .filter((s) => s.id.startsWith('test_brier_'))
    .count();

  assert(
    remainingTestSessions === 0,
    `6.1 Alle 7 test-sessies zijn definitief verwijderd (${remainingTestSessions} resterend)`
  );
  assert(
    remainingTestCatches === 0,
    `6.2 Alle test-vangsten zijn definitief verwijderd (${remainingTestCatches} resterend)`
  );
  assert(
    remainingTestSnapshots === 0,
    `6.3 Alle 7 gekoppelde test-momentopnames zijn definitief verwijderd (${remainingTestSnapshots} resterend)`
  );

  // Verifieer dat de echte database precies overeenkomt met de toestand vóór de test
  const finalSessionCount = await db.sessions.count();
  const finalCatchCount = await db.catches.count();
  const finalSnapshotCount = await db.prognosisSnapshots.count();

  assert(
    finalSessionCount === initialSessionCount,
    `6.4 Aantal sessies in database exact hersteld (${finalSessionCount} === ${initialSessionCount})`
  );
  assert(
    finalCatchCount === initialCatchCount,
    `6.5 Aantal vangsten in database exact hersteld (${finalCatchCount} === ${initialCatchCount})`
  );
  assert(
    finalSnapshotCount === initialSnapshotCount,
    `6.6 Aantal momentopnames in database exact hersteld (${finalSnapshotCount} === ${initialSnapshotCount})`
  );

  console.log('\n======================================================================');
  console.log(`TESTRESULTAAT INTEGRATIETEST: ${passed} GESLAAGD, ${failed} MISLUKT`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBrierIntegrationTest().catch((err) => {
  console.error('Onverwachte fout tijdens Brier integratietest:', err);
  process.exit(1);
});
