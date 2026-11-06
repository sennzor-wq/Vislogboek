import 'fake-indexeddb/auto';
import { db, deleteSessionSafely, deletePrognosisSnapshotSafely } from './src/db/db';
import { evaluatePrognosisPerformance } from './src/services/evaluationEngine';
import { FishingSession, PrognosisSnapshot, CatchItem, SessionRod, PlannedFishingSession, CoachAdviceRecord } from './src/types';

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

async function runTestSuite() {
  console.log('\n=== STARTING VEILIG VERWIJDEREN VAN PROGNOSES EN SESSIES SUITE ===');

  // ==========================================
  // DEEL 1: AFZONDERLIJK VERWIJDEREN VAN EEN MOMENTOPNAME
  // ==========================================
  console.log('\n--- TESTGROEP 1: Afzonderlijk Verwijderen Momentopname ---');

  const snap1: PrognosisSnapshot = {
    id: 'snap_del_001',
    forecastTimestamp: '2026-10-29T10:00:00Z',
    targetDate: '2026-10-29',
    targetSpecies: 'Karper',
    locationId: 'spot-de-plas',
    locationName: 'De Grote Plas',
    durationHours: 3,
    predictedActivityScore: 7.5,
    predictedCatchChance: 65,
    source: 'live_prognosis',
    modelVersion: 'v2.2',
    actualOutcome: 'catch',
    linkedSessionId: 'sess_keep_001',
    createdAt: new Date().toISOString(),
  };
  await db.prognosisSnapshots.put(snap1);

  const sess1: FishingSession = {
    id: 'sess_keep_001',
    locationId: 'spot-de-plas',
    locationName: 'De Grote Plas',
    startTime: '2026-10-29T10:00:00Z',
    endTime: '2026-10-29T13:00:00Z',
    durationMinutes: 180,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    snapshotId: snap1.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.sessions.put(sess1);

  const catch1: CatchItem = {
    id: 'catch_001',
    sessionId: sess1.id,
    locationId: 'spot-de-plas',
    species: 'Karper',
    count: 1,
    weightKg: 8.5,
    timestamp: '2026-10-29T11:30:00Z',
    createdAt: new Date().toISOString(),
  };
  await db.catches.put(catch1);

  // Verwijder alleen de momentopname
  const snapDeleted = await deletePrognosisSnapshotSafely(snap1.id);
  assert(snapDeleted === true, '1.1 deletePrognosisSnapshotSafely retourneert true bij succes');

  const snapInDb = await db.prognosisSnapshots.get(snap1.id);
  assert(snapInDb === undefined, '1.2 Momentopname is definitief verwijderd uit db.prognosisSnapshots');

  const sessAfterSnapDel = await db.sessions.get(sess1.id);
  assert(sessAfterSnapDel !== undefined, '1.3 Gekoppelde vissessie blijft behouden in db.sessions');
  assert(
    sessAfterSnapDel?.snapshotId === undefined,
    '1.4 snapshotId op gekoppelde sessie is veilig leeggemaakt (undefined)'
  );

  const catchAfterSnapDel = await db.catches.get(catch1.id);
  assert(catchAfterSnapDel !== undefined, '1.5 Vangsten van de vissessie blijven ongewijzigd behouden');

  // Idempotente aanroep op reeds verwijderde snapshot
  const deleteAgain = await deletePrognosisSnapshotSafely(snap1.id);
  assert(deleteAgain === false, '1.6 Herhaald verwijderen van dezelfde snapshotId retourneert veilig false');

  // ==========================================
  // DEEL 2: VERWIJDEREN VAN EEN GEKOPPELDE SESSIE
  // ==========================================
  console.log('\n--- TESTGROEP 2: Verwijderen van Gekoppelde Sessie (Cascade naar Snapshot) ---');

  const snap2: PrognosisSnapshot = {
    id: 'snap_cascade_002',
    forecastTimestamp: '2026-10-30T10:00:00Z',
    targetDate: '2026-10-30',
    targetSpecies: 'Karper',
    locationId: 'spot-het-kanaal',
    locationName: 'Het Kanaal',
    durationHours: 4,
    predictedActivityScore: 6.8,
    predictedCatchChance: 55,
    source: 'live_prognosis',
    modelVersion: 'v2.2',
    linkedSessionId: 'sess_del_002',
    actualOutcome: 'catch',
    createdAt: new Date().toISOString(),
  };
  await db.prognosisSnapshots.put(snap2);

  const sess2: FishingSession = {
    id: 'sess_del_002',
    locationId: 'spot-het-kanaal',
    locationName: 'Het Kanaal',
    startTime: '2026-10-30T10:00:00Z',
    endTime: '2026-10-30T14:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    snapshotId: snap2.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.sessions.put(sess2);

  const catch2: CatchItem = {
    id: 'catch_002',
    sessionId: sess2.id,
    locationId: 'spot-het-kanaal',
    species: 'Karper',
    count: 2,
    weightKg: 12.0,
    timestamp: '2026-10-30T12:00:00Z',
    createdAt: new Date().toISOString(),
  };
  await db.catches.put(catch2);
  const rodForDeletedSession: SessionRod = {
    id: 'rod-for-deleted-session', sessionId: sess2.id, rodNumber: 1,
    activeIntervals: [{ id: 'rod-interval', startTime: '2026-10-30T10:00:00Z', endTime: '2026-10-30T12:00:00Z' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await db.sessionRods.put(rodForDeletedSession);

  const planSnapshot: PrognosisSnapshot = {
    id: 'plan-snapshot-for-deleted-session',
    forecastTimestamp: '2026-10-30T08:00:00Z',
    targetDate: '2026-10-30',
    targetSpecies: 'Karper',
    durationHours: 4,
    durationKnown: true,
    predictedActivityScore: 6.5,
    predictedCatchChance: 50,
    source: 'viscoach-plan',
    modelVersion: 'v2.2',
    createdAt: new Date().toISOString(),
    runKind: 'plan',
  };
  await db.prognosisSnapshots.put(planSnapshot);
  const plannedRecord: PlannedFishingSession = {
    id: 'planned-record-linked-to-deleted-session',
    locationId: 'spot-het-kanaal',
    targetSpecies: 'Karper',
    plannedStartTime: '2026-10-30T10:00:00Z',
    plannedEndTime: '2026-10-30T14:00:00Z',
    status: 'started',
    planSnapshotId: planSnapshot.id,
    startedSessionId: sess2.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.plannedSessions.put(plannedRecord);
  const adviceRecord: CoachAdviceRecord = {
    id: 'advice-linked-to-deleted-session',
    sessionId: sess2.id,
    prognosisSnapshotId: snap2.id,
    createdAt: new Date().toISOString(),
    trigger: 'session_start',
    summary: 'Startadvies',
    recommendation: 'Vis op de gekozen zone',
    rationale: 'Testreden',
    changedFactors: [],
    coachVersion: 'test-v1',
  };
  await db.coachAdviceRecords.put(adviceRecord);

  // Verwijder de sessie
  const sessDeleted = await deleteSessionSafely(sess2.id);
  assert(sessDeleted === true, '2.1 deleteSessionSafely retourneert true bij succes');

  const sessInDb = await db.sessions.get(sess2.id);
  assert(sessInDb === undefined, '2.2 Sessie is definitief verwijderd uit db.sessions');

  const catchesInDb = await db.catches.where('sessionId').equals(sess2.id).toArray();
  assert(catchesInDb.length === 0, '2.3 Gekoppelde vangsten zijn verwijderd uit db.catches');
  assert(await db.sessionRods.get(rodForDeletedSession.id) === undefined, '2.3a Gekoppelde hengeldetails worden mee verwijderd');

  const snapCascadeInDb = await db.prognosisSnapshots.get(snap2.id);
  assert(
    snapCascadeInDb === undefined,
    '2.4 Gekoppelde momentopname (via session.snapshotId) is eveneens definitief verwijderd'
  );
  assert(await db.coachAdviceRecords.get(adviceRecord.id) === undefined, '2.4a Coachadviezen worden bij expliciete sessieverwijdering meegenomen');
  const planAfterSessionDelete = await db.plannedSessions.get(plannedRecord.id);
  assert(
    planAfterSessionDelete !== undefined &&
      planAfterSessionDelete.startedSessionId === undefined &&
      !!planAfterSessionDelete.startedSessionDeletedAt,
    '2.4b Geplande sessie blijft bewaard en alleen de verwijzing naar de verwijderde sessie wordt losgemaakt'
  );
  assert(await db.prognosisSnapshots.get(planSnapshot.id) !== undefined, '2.4c De oorspronkelijke planprognose blijft behouden');

  // Idempotente sessie verwijdering
  const deleteSessAgain = await deleteSessionSafely(sess2.id);
  assert(deleteSessAgain === false, '2.5 Herhaald verwijderen van dezelfde sessie retourneert veilig false');

  // ==========================================
  // DEEL 3: SESSIES ZONDER OF MET ONTBREKENDE KOPPELING
  // ==========================================
  console.log('\n--- TESTGROEP 3: Sessies Zonder of Met Ontbrekende Koppeling ---');

  // 3.1 Sessie zonder snapshotId
  const snapUnrelated: PrognosisSnapshot = {
    id: 'snap_unrelated_003',
    forecastTimestamp: '2026-10-31T10:00:00Z',
    targetDate: '2026-10-31',
    targetSpecies: 'Snoek',
    durationHours: 2,
    predictedActivityScore: 8.0,
    predictedCatchChance: 40,
    source: 'live_prognosis',
    modelVersion: 'v2.2',
    createdAt: new Date().toISOString(),
  };
  await db.prognosisSnapshots.put(snapUnrelated);

  const sessNoSnap: FishingSession = {
    id: 'sess_no_snap_003',
    locationId: 'spot-de-plas',
    locationName: 'De Grote Plas',
    startTime: '2026-10-31T10:00:00Z',
    outcome: 'catch',
    targetSpecies: ['Snoek'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.sessions.put(sessNoSnap);

  await deleteSessionSafely(sessNoSnap.id);
  const snapStillExists = await db.prognosisSnapshots.get(snapUnrelated.id);
  assert(
    snapStillExists !== undefined,
    '3.1 Verwijderen van sessie zonder snapshotId raakt niet-gekoppelde momentopnames niet'
  );

  const planProtectingSnapshot: PlannedFishingSession = {
    id: 'plan-protecting-snapshot',
    locationId: 'spot-de-plas',
    targetSpecies: 'Snoek',
    plannedStartTime: '2026-10-31T10:00:00Z',
    status: 'planned',
    planSnapshotId: snapUnrelated.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.plannedSessions.put(planProtectingSnapshot);
  let snapshotDeleteBlocked = false;
  try {
    await deletePrognosisSnapshotSafely(snapUnrelated.id);
  } catch {
    snapshotDeleteBlocked = true;
  }
  assert(snapshotDeleteBlocked, '3.1a Een planverwijzing beschermt de bijbehorende prognosesnapshot tegen losse verwijdering');
  assert(await db.prognosisSnapshots.get(snapUnrelated.id) !== undefined, '3.1b Beschermde planprognose blijft behouden');
  await db.plannedSessions.delete(planProtectingSnapshot.id);

  // 3.2 Sessie met snapshotId naar reeds ontbrekende snapshot (gebroken koppeling)
  const sessBrokenSnap: FishingSession = {
    id: 'sess_broken_snap_004',
    locationId: 'spot-de-plas',
    locationName: 'De Grote Plas',
    startTime: '2026-11-01T10:00:00Z',
    outcome: 'skunk_confirmed',
    targetSpecies: ['Karper'],
    snapshotId: 'non_existent_snapshot_id_xyz',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.sessions.put(sessBrokenSnap);

  const delBrokenSuccess = await deleteSessionSafely(sessBrokenSnap.id);
  assert(
    delBrokenSuccess === true,
    '3.2 Sessie met niet-bestaande snapshotId wordt veilig verwijderd zonder crash'
  );

  // ==========================================
  // DEEL 4: HERBEREKENING VAN BRIER-SCORE & KALIBRATIE
  // ==========================================
  console.log('\n--- TESTGROEP 4: Herberekening Brier-score en Validatie na Verwijdering ---');

  // Maak 6 voltooide momentopnames in db
  await db.prognosisSnapshots.clear();

  const sixSnapshots: PrognosisSnapshot[] = [
    { id: 's_eval_1', forecastTimestamp: '2026-10-01T07:00:00Z', targetDate: '2026-10-01', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 7, predictedCatchChance: 70, actualOutcome: 'catch', linkedSessionId: 's_eval_session_1', source: '', modelVersion: 'v2.2', createdAt: '' },
    { id: 's_eval_2', forecastTimestamp: '2026-10-02T07:00:00Z', targetDate: '2026-10-02', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 6, predictedCatchChance: 60, actualOutcome: 'catch', linkedSessionId: 's_eval_session_2', source: '', modelVersion: 'v2.2', createdAt: '' },
    { id: 's_eval_3', forecastTimestamp: '2026-10-03T07:00:00Z', targetDate: '2026-10-03', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 6, predictedCatchChance: 60, actualOutcome: 'skunk_confirmed', linkedSessionId: 's_eval_session_3', source: '', modelVersion: 'v2.2', createdAt: '' },
    { id: 's_eval_4', forecastTimestamp: '2026-10-04T07:00:00Z', targetDate: '2026-10-04', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 5, predictedCatchChance: 20, actualOutcome: 'skunk_confirmed', linkedSessionId: 's_eval_session_4', source: '', modelVersion: 'v2.2', createdAt: '' },
    { id: 's_eval_5', forecastTimestamp: '2026-10-05T07:00:00Z', targetDate: '2026-10-05', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 7, predictedCatchChance: 50, actualOutcome: 'catch', linkedSessionId: 's_eval_session_5', source: '', modelVersion: 'v2.2', createdAt: '' },
    { id: 's_eval_6', forecastTimestamp: '2026-10-06T07:00:00Z', targetDate: '2026-10-06', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 8, predictedCatchChance: 80, actualOutcome: 'catch', linkedSessionId: 's_eval_session_6', source: '', modelVersion: 'v2.2', createdAt: '' },
  ];
  const evaluationSessions: FishingSession[] = sixSnapshots.map((snapshot, index) => ({
    id: snapshot.linkedSessionId!,
    startTime: `2026-10-0${index + 1}T08:00:00Z`,
    endTime: `2026-10-0${index + 1}T11:00:00Z`,
    outcome: snapshot.actualOutcome as 'catch' | 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: `2026-10-0${index + 1}T08:00:00Z`,
    updatedAt: `2026-10-0${index + 1}T11:00:00Z`,
  }));
  await db.sessions.bulkPut(evaluationSessions);
  for (const s of sixSnapshots) {
    await db.prognosisSnapshots.put(s);
  }

  // Initial calculation with 6 snapshots
  const all6 = await db.prognosisSnapshots.toArray();
  const eval6 = evaluatePrognosisPerformance(all6, all6, evaluationSessions);
  assert(
    eval6.evaluatedCount === 6 && eval6.hasSufficientData === true,
    `4.1 Initiële evaluatie met 6 snapshots: evaluatedCount=${eval6.evaluatedCount}, hasSufficientData=true`
  );

  // Verwijder 1 snapshot: s_eval_6 (f=0.8, o=1.0)
  await deletePrognosisSnapshotSafely('s_eval_6');
  const all5 = await db.prognosisSnapshots.toArray();
  const eval5 = evaluatePrognosisPerformance(all5, all5, evaluationSessions);

  assert(
    eval5.evaluatedCount === 5 && eval5.totalSnapshots === 5,
    `4.2 Na verwijdering van 1 snapshot telt evaluatedCount exact 5 (was 6, nu: ${eval5.evaluatedCount})`
  );
  assert(
    eval5.hasSufficientData === true,
    '4.3 Bij 5 resterende snapshots is hasSufficientData nog true'
  );
  // Som kwadratische fout voor eerste 5:
  // s1: (0.7-1)^2 = 0.09
  // s2: (0.6-1)^2 = 0.16
  // s3: (0.6-0)^2 = 0.36
  // s4: (0.2-0)^2 = 0.04
  // s5: (0.5-1)^2 = 0.25
  // Totaal = 0.90 / 5 = 0.180
  assert(
    eval5.brierScore === 0.18,
    `4.4 Brier-score herberekend op exact 5 resterende snapshots (berekend: ${eval5.brierScore}, verwacht: 0.180)`
  );

  // Verwijder nog 1 snapshot -> nu N=4 (<5 drempel)
  await deletePrognosisSnapshotSafely('s_eval_5');
  const all4 = await db.prognosisSnapshots.toArray();
  const eval4 = evaluatePrognosisPerformance(all4, all4, evaluationSessions);

  assert(
    eval4.evaluatedCount === 4 && eval4.hasSufficientData === false,
    `4.5 Na verwijdering onder drempel (N=4) meldt evaluatie hasSufficientData: false (${eval4.evaluatedCount} < 5)`
  );
  assert(
    eval4.brierScore === null && eval4.statusMessage.includes('Nog niet gevalideerd'),
    `4.6 Brier-score wordt op null gezet en toont status "Nog niet gevalideerd"`
  );

  // ==========================================
  // DEEL 5: BESCHERMDE BENCHMARKS KUNNEN NIET WORDEN VERWIJDERD
  // ==========================================
  console.log('\n--- TESTGROEP 5: Bescherming van Benchmarkgegevens ---');

  const benchmarkSession: FishingSession = {
    id: 'protected_bench_sess',
    locationId: 'spot-de-plas',
    startTime: '2026-10-19T18:00:00Z',
    outcome: 'catch',
    targetSpecies: ['Karper'],
    isBenchmark: true,
    createdAt: '',
    updatedAt: '',
  };
  await db.sessions.put(benchmarkSession);

  let benchSessErrorCaught = false;
  try {
    await deleteSessionSafely(benchmarkSession.id);
  } catch (err) {
    benchSessErrorCaught = true;
  }
  assert(benchSessErrorCaught === true, '5.1 deleteSessionSafely weigert beschermde benchmark sessie met fout');
  const benchSessInDb = await db.sessions.get(benchmarkSession.id);
  assert(benchSessInDb !== undefined, '5.2 Benchmark sessie bevindt zich nog veilig in de database');

  const benchmarkSnapshot: PrognosisSnapshot = {
    id: 'protected_bench_snap',
    forecastTimestamp: '',
    targetDate: '2026-10-19',
    targetSpecies: 'Brasem',
    durationHours: 3,
    predictedActivityScore: 8,
    predictedCatchChance: 90,
    source: '',
    modelVersion: 'v2.2',
    isBenchmark: true,
    createdAt: '',
  } as any;
  await db.prognosisSnapshots.put(benchmarkSnapshot);

  let benchSnapErrorCaught = false;
  try {
    await deletePrognosisSnapshotSafely(benchmarkSnapshot.id);
  } catch (err) {
    benchSnapErrorCaught = true;
  }
  assert(
    benchSnapErrorCaught === true,
    '5.3 deletePrognosisSnapshotSafely weigert beschermde benchmark snapshot met fout'
  );
  const benchSnapInDb = await db.prognosisSnapshots.get(benchmarkSnapshot.id);
  assert(benchSnapInDb !== undefined, '5.4 Benchmark snapshot bevindt zich nog veilig in de database');

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
