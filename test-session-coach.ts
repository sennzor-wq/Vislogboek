import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import {
  changedSignatureFactors,
  createInitialCoachAdviceRecord,
  getAdviceBaselineSnapshot,
  prognosisSignature,
  requiresWeatherConfirmation,
  updateCoachAdviceFeedback,
  nextWeatherChangeConfirmation,
} from './src/services/sessionCoachService';
import { FishingSession, PrognosisSnapshot } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`[PASS] ${label}`); passed++; }
  else { console.error(`[FAIL] ${label}`); failed++; }
}

async function run() {
  await db.delete();
  await db.open();

  const session: FishingSession = {
    id: 'coach-test-session',
    startTime: '2026-11-05T10:00:00.000Z',
    outcome: 'active',
    targetSpecies: ['Karper'],
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
  };
  const snapshot: PrognosisSnapshot = {
    id: 'coach-test-snapshot',
    runKind: 'session_start',
    linkedSessionId: session.id,
    forecastTimestamp: '2026-11-05T10:00:00.000Z',
    targetDate: '2026-11-05',
    targetSpecies: 'Karper',
    durationHours: 0,
    durationKnown: false,
    predictedActivityScore: 6,
    predictedCatchChance: null,
    source: 'test',
    modelVersion: 'test-v1',
    engineVersions: { prognosis: '1.0.0', waterThermal: '1.0.0' },
    createdAt: '2026-11-05T10:00:00.000Z',
    prognosisData: {
      date: '2026-11-05',
      dayName: 'Vandaag',
      species: 'Karper',
      activityScore: 6,
      advice: 'Gunstig',
      bestTimeSlot: 'Ochtend',
      alternativeTimeSlots: [],
      summaryRationale: 'Testreden voor de startsituatie.',
      personalCatchChance: null,
      personalCatchConfidence: 'Onvoldoende gegevens',
      relevantSessionCount: 0,
      provenance: 'Algemene biologische regels',
      timeSlots: {},
    } as any,
  };

  await db.sessions.put(session);
  await db.prognosisSnapshots.put(snapshot);

  const first = await createInitialCoachAdviceRecord(session, snapshot);
  const second = await createInitialCoachAdviceRecord(session, snapshot);
  const stored = await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray();

  assert(first !== null, 'Startsnapshot levert een eerste coachadvies op');
  assert(first?.trigger === 'session_start', 'Eerste advies is herkenbaar als sessiestartadvies');
  assert(first?.prognosisSnapshotId === snapshot.id, 'Coachadvies verwijst naar de volledige startsnapshot');
  assert(first?.engineVersions?.waterThermal === '1.0.0' && first.engineVersions.prognosis === '1.0.0',
    'Coachadvies bewaart de volledige engineversiekaart van de gebruikte snapshot');
  assert(second?.id === first?.id && stored.length === 1, 'Herhaald opslaan maakt geen dubbele startadviezen');
  assert(!!first && first.recommendation.length > 0 && first.rationale.length > 0, 'Advies bevat een aanbeveling en herleidbare reden');

  const feedbackSaved = first
    ? await updateCoachAdviceFeedback(first.id, { response: 'adapted', executedTactic: 'Hengelpunt verplaatst naar de diepere overgangszone' })
    : null;
  assert(
    feedbackSaved?.response === 'adapted' && !!feedbackSaved.responseAt,
    'Gebruikersreactie wordt met registratietijd op het adviesrecord opgeslagen'
  );
  assert(
    feedbackSaved?.executedTactic === 'Hengelpunt verplaatst naar de diepere overgangszone' && !!feedbackSaved.executedAt,
    'Daadwerkelijk uitgevoerde tactiek wordt afzonderlijk met tijdstip vastgelegd'
  );
  assert(
    feedbackSaved?.prognosisSnapshotId === snapshot.id && feedbackSaved?.recommendation === first?.recommendation,
    'Feedback wijzigt de oorspronkelijke prognoseverwijzing en adviesinhoud niet'
  );

  const baselinePrognosis = {
    ...snapshot.prognosisData!,
    activityScore: 6,
    summaryRationale: 'Eerste toelichting',
    positioningAdvice: { recommendedZone: 'Diepere overgangszone' },
  } as any;
  const smallFluctuation = {
    ...baselinePrognosis,
    activityScore: 6.1,
    summaryRationale: 'Licht gewijzigde toelichting door een kleine weersupdate',
  } as any;
  assert(
    changedSignatureFactors(prognosisSignature(baselinePrognosis), prognosisSignature(smallFluctuation)).length === 0,
    'Kleine scorefluctuatie en gewijzigde toelichting veroorzaken geen nieuw praktisch advies'
  );

  const meaningfulTacticalChange = {
    ...smallFluctuation,
    positioningAdvice: { recommendedZone: 'Aanlandige oeverzone' },
  } as any;
  assert(
    changedSignatureFactors(prognosisSignature(baselinePrognosis), prognosisSignature(meaningfulTacticalChange))
      .includes('recommendedZone'),
    'Een daadwerkelijk gewijzigde aanbevolen stekzone wordt als praktische verandering herkend'
  );

  const combinedPracticalChange = {
    ...baselinePrognosis,
    advice: 'Ongunstig',
    bestTimeSlot: 'Avond',
    positioningAdvice: { recommendedZone: 'Aanlandige oeverzone' },
  } as any;
  const combinedChanges = changedSignatureFactors(
    prognosisSignature(baselinePrognosis),
    prognosisSignature(combinedPracticalChange)
  );
  assert(
    ['advice', 'bestTimeSlot', 'recommendedZone'].every((factor) => combinedChanges.includes(factor)),
    'Gecombineerde wijzigingen in prognose en tactiek worden samen herkend'
  );

  assert(requiresWeatherConfirmation('weather_update'), 'Automatische forecast-refresh vereist bevestiging');
  assert(!requiresWeatherConfirmation('app_resume'), 'App-hervatten beoordeelt direct de meest recente beschikbare gegevens');
  assert(!requiresWeatherConfirmation('manual_reanalysis'), 'Handmatige heranalyse wordt direct beoordeeld');
  assert(!requiresWeatherConfirmation('observation_recorded'), 'Een expliciete gebruikerswaarneming wordt direct beoordeeld');
  assert(!requiresWeatherConfirmation('catch_recorded'), 'Een geregistreerde vangst wordt direct beoordeeld');
  assert(!requiresWeatherConfirmation('session_changed'), 'Een expliciete sessiewijziging wordt direct beoordeeld');

  const candidateSignature = prognosisSignature(meaningfulTacticalChange);
  const firstConfirmation = nextWeatherChangeConfirmation(undefined, candidateSignature);
  const secondConfirmation = nextWeatherChangeConfirmation(firstConfirmation, candidateSignature);
  const changedCandidate = nextWeatherChangeConfirmation(firstConfirmation, prognosisSignature(combinedPracticalChange));
  assert(firstConfirmation.confirmations === 1, 'Een nieuwe weerskandidaat start met één bevestiging');
  assert(secondConfirmation.confirmations === 2, 'Dezelfde praktische wijziging krijgt bij een volgende afwijkende invoer de tweede bevestiging');
  assert(changedCandidate.confirmations === 1, 'Een andere praktische kandidaat start de bevestiging opnieuw en erft geen eerdere bevestiging');

  const newerUnadvisedSnapshot: PrognosisSnapshot = {
    ...snapshot,
    id: 'coach-test-unadvised-newer-snapshot',
    runKind: 'session_update',
    createdAt: '2026-11-05T11:00:00.000Z',
  };
  assert(
    getAdviceBaselineSnapshot(
      [snapshot, newerUnadvisedSnapshot],
      first ?? undefined,
      newerUnadvisedSnapshot
    )?.id === snapshot.id,
    'Vergelijkingsbasis blijft het snapshot van het laatst getoonde advies, niet een nieuwere onbeoordeelde snapshot'
  );

  await db.delete();
  console.log(`Session coach tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
