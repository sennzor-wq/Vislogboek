import 'fake-indexeddb/auto';
import { db, syncSessionPresenceObservations } from './src/db/db';
import { saveSessionWithPrognosisSnapshot, PendingPrognosisSnapshot } from './src/services/prognosisEngine';
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
    locationName: 'Bomedikke speeltuin',
    chosenSlot: 'Avond',
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

  await db.delete();
  console.log(`Session snapshot commit tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch(async (error) => {
  console.error(error);
  try { await db.delete(); } catch {}
  process.exit(1);
});
