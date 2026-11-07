import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { saveSessionWithPrognosisSnapshot } from './src/services/prognosisEngine';
import {
  changedSignatureFactors,
  buildVisCoachAdviceText,
  createInitialCoachAdviceRecord,
  getAdviceBaselineSnapshot,
  getSessionUpdateTrigger,
  summarizeCoachSessionOutcome,
  prognosisSignature,
  requiresWeatherConfirmation,
  updateCoachAdviceFeedback,
  nextWeatherChangeConfirmation,
  persistCoachReassessment,
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

  const preStartSession: FishingSession = {
    ...session,
    id: 'coach-prestart-session',
    startTime: '2026-11-05T10:01:00.000Z',
  };
  const preStartPending = {
    prognosis: snapshot.prognosisData!,
    durationHours: 0,
    durationKnown: false,
    locationName: 'Testwater',
    forecastTimestamp: '2026-11-05T10:00:30.000Z',
    inputContext: { calculatedAt: '2026-11-05T10:00:30.000Z' } as any,
    runKind: 'session_start' as const,
  };
  const savedPreStartSession = await saveSessionWithPrognosisSnapshot(preStartSession, preStartPending);
  const savedPreStartSnapshot = await db.prognosisSnapshots.get(savedPreStartSession.snapshotId!);
  assert(
    !!savedPreStartSnapshot &&
    savedPreStartSnapshot.forecastTimestamp === preStartPending.forecastTimestamp &&
    Date.parse(savedPreStartSnapshot.forecastTimestamp) < Date.parse(savedPreStartSession.startTime),
    'Startsnapshot bewaart het oorspronkelijke berekeningstijdstip en ligt vóór de sessiestart'
  );

  const invalidPreStartSession: FishingSession = {
    ...preStartSession,
    id: 'coach-invalid-prestart-session',
    startTime: '2026-11-05T10:00:00.000Z',
  };
  let invalidPreStartRejected = false;
  try {
    await saveSessionWithPrognosisSnapshot(invalidPreStartSession, preStartPending);
  } catch {
    invalidPreStartRejected = true;
  }
  assert(
    invalidPreStartRejected && !(await db.sessions.get(invalidPreStartSession.id)),
    'Een snapshot op of na de sessiestart blokkeert het starten en laat geen sessie achter'
  );

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

  const translatedAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    bestTimeSlot: 'Avond',
    positioningAdvice: {
      recommendedZone: 'Aanlandige oeverzone',
      rationale: 'De wind duwt voedsel richting deze oever.',
      alternativeOption: 'Probeer bij weinig activiteit de diepere overgangszone.',
      missingInformation: [],
      windContext: { directionText: 'Zuidwest', speedKmH: 24, isStrongWind: true, isColdWind: false },
      windCastingGuidance: {
        castingAdvice: {
          isCastingDirectionDefinite: false,
          recommendedDirection: null,
          summary: 'Oeverrichting ontbreekt.',
          reason: 'GPS-punt bepaalt de oeverrichting niet.',
          scenarioGuidance: { standingLeewardBank: '', standingWindwardBank: '' },
        },
      },
    },
    bankWindAnalysis: {
      isConfigured: false,
      windOriginDirection: 'Zuidwest',
      windDestinationDirection: 'Noordoost',
      windSpeedKmH: 24,
      relation: 'Onbekende oeveroriëntatie',
      bankAssessment: { explanation: 'De windrichting is bekend, maar de oeverzijde niet.' },
      rodPlacementAdvice: { primaryPosition: '', rationale: '', castingDirectionAdvice: '' },
      missingInformation: [],
      fieldChecklist: [],
    },
    habitatAnalysis: {
      primaryZone: { name: 'Rietkraag', whyLikely: 'Hier kan natuurlijk voedsel samenkomen.' },
      alternativeZone: { name: 'Diepere overgangszone' },
      movementHypothesis: {},
      missingInformation: [],
    },
    prebaitPlan: {
      sessionDayGuidance: { advice: 'Voer beperkt bij en bouw de stek rustig op.' },
      methodFeederGuidance: 'Method feeder uitleg.',
    },
    thermalAnalysis: { hasMeasuredWaterTemp: false, estimatedWaterTemp: 3.8 },
    uncertaintyNotes: [
      'Er zijn 3 vergelijkbare eigen sessies in de database voor deze selectie (minimaal 5 vereist).',
      'Exacte oeverlijnoriëntatie en omtrek van het water zijn niet bekend in het systeem (GPS is een enkel punt).',
    ],
  } as any, { windSpeed: 24, windDirection: 225, windDirectionText: 'Zuidwest' } as any, 'Method feeder');
  const translatedText = [
    translatedAdvice.summary,
    translatedAdvice.recommendation,
    translatedAdvice.rationale,
  ].join(' ').toLowerCase();
  assert(
    translatedText.includes('avond') &&
    translatedText.includes('rietkraag') &&
    translatedText.includes('wind') &&
    translatedText.includes('waait richting noordoost') &&
    translatedText.includes('werprichting') &&
    translatedText.includes('method feeder') &&
    translatedText.includes('geschat op ongeveer 3.8 °c') &&
    translatedText.includes('persoonlijke vangkans betrouwbaar'),
    'VisCoach maakt een praktisch plan, legt sterke wind en werprichting uit en benoemt onzekerheid begrijpelijk'
  );
  assert(
    translatedAdvice.recommendation.includes('Als het niet werkt') &&
    translatedAdvice.recommendation.includes('Waar beginnen'),
    'Het advies bevat een duidelijke startplek en een vervolgstap'
  );
  const calmAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    positioningAdvice: {
      recommendedZone: 'Algemene zoekzone',
      windContext: { directionText: 'Noord', speedKmH: 5, isStrongWind: false, isColdWind: false },
    },
  } as any);
  assert(
    !calmAdvice.recommendation.includes('Wind en werprichting'),
    'Bij zwakke wind wordt geen onnodig wind- of werprichtingadvies getoond'
  );

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
  assert(requiresWeatherConfirmation('app_resume'), 'App-hervatten start opnieuw een voorzichtige weersbevestiging na heropenen');
  assert(!requiresWeatherConfirmation('manual_reanalysis'), 'Handmatige heranalyse wordt direct beoordeeld');
  assert(!requiresWeatherConfirmation('observation_recorded'), 'Een expliciete gebruikerswaarneming wordt direct beoordeeld');
  assert(!requiresWeatherConfirmation('catch_recorded'), 'Een geregistreerde vangst wordt direct beoordeeld');
  assert(!requiresWeatherConfirmation('session_changed'), 'Een expliciete sessiewijziging wordt direct beoordeeld');

  const observationBase: FishingSession = {
    ...session,
    presenceObservations: ['vis_springen_rollen', 'aasbellen_voedselactiviteit'],
    waterTemperature: 12.4,
    waterTemperatureMeasuredAt: '2026-11-05T10:30:00.000Z',
    waterTemperatureMeasurementSource: 'manual',
    waterTemperatureMeasurementMethod: 'thermometer',
  };
  assert(
    getSessionUpdateTrigger(observationBase, {
      ...observationBase,
      presenceObservations: ['aasbellen_voedselactiviteit', 'vis_springen_rollen'],
    }) === 'session_changed',
    'Een andere volgorde van dezelfde waarnemingen geldt niet als nieuwe observatie'
  );
  assert(
    getSessionUpdateTrigger(observationBase, {
      ...observationBase,
      presenceObservations: ['vis_springen_rollen'],
    }) === 'observation_recorded',
    'Een gewijzigde viswaarneming triggert expliciete herbeoordeling als observatie'
  );
  assert(
    getSessionUpdateTrigger(observationBase, {
      ...observationBase,
      waterTemperature: 13.1,
      waterTemperatureMeasuredAt: '2026-11-05T11:00:00.000Z',
    }) === 'observation_recorded',
    'Een nieuwe watertemperatuurmeting triggert expliciete herbeoordeling als observatie'
  );
  assert(
    getSessionUpdateTrigger(observationBase, {
      ...observationBase,
      notes: 'Aantekening bijgewerkt',
    }) === 'session_changed',
    'Een gewone notitieaanpassing wordt niet als waarneming geclassificeerd'
  );

  const outcomeSession: FishingSession = {
    ...session,
    outcome: 'catch',
    targetSpecies: ['Karper'],
  };
  const targetCatch = {
    id: 'coach-target-catch',
    sessionId: outcomeSession.id,
    species: 'Karper',
    count: 2,
    timestamp: '2026-11-05T12:00:00.000Z',
    createdAt: '2026-11-05T12:00:00.000Z',
  } as any;
  const bycatch = { ...targetCatch, id: 'coach-bycatch', species: 'Brasem', count: 1 };
  const unknownSpeciesCatch = {
    ...targetCatch,
    id: 'coach-unknown-species',
    species: 'Overig',
    legacyImportQuality: { speciesKnown: false, countKnown: false, timestampKnown: false },
  } as any;
  assert(
    summarizeCoachSessionOutcome(outcomeSession, [targetCatch]) === 'Doelsoort geregistreerd: 2 vissen',
    'Sessie-evaluatie telt alleen geregistreerde vangsten van de gekozen doelsoort'
  );
  assert(
    summarizeCoachSessionOutcome(outcomeSession, [bycatch]) === 'Andere soort(en) geregistreerd; geen doelsoortvangst vastgelegd',
    'Bijvangst wordt niet als doelsoortsucces gepresenteerd'
  );
  assert(
    summarizeCoachSessionOutcome(outcomeSession, [unknownSpeciesCatch]) === 'Vangst geregistreerd; doelsoortresultaat deels onbekend',
    'Een legacyvangst met onbekende soort wordt niet als doelsoortsucces geteld'
  );
  assert(
    summarizeCoachSessionOutcome({ ...outcomeSession, outcome: 'skunk_confirmed' }, []) === 'Bevestigde nulvangst',
    'Een expliciet bevestigde nulvangst blijft herkenbaar in de coachterugblik'
  );

  const candidateSignature = prognosisSignature(meaningfulTacticalChange);
  const firstConfirmation = nextWeatherChangeConfirmation(undefined, candidateSignature);
  const secondConfirmation = nextWeatherChangeConfirmation(firstConfirmation, candidateSignature);
  const changedCandidate = nextWeatherChangeConfirmation(firstConfirmation, prognosisSignature(combinedPracticalChange));
  assert(firstConfirmation.confirmations === 1, 'Een nieuwe weerskandidaat start met één bevestiging');
  assert(secondConfirmation.confirmations === 2, 'Dezelfde praktische wijziging krijgt bij een volgende afwijkende invoer de tweede bevestiging');
  assert(changedCandidate.confirmations === 1, 'Een andere praktische kandidaat start de bevestiging opnieuw en erft geen eerdere bevestiging');

  const updatePrognosis = {
    ...snapshot.prognosisData!,
    bestTimeSlot: 'Avond',
    activityScoreAvailable: false,
    activityScore: 5,
    advice: 'Gunstig',
    summaryRationale: 'Praktische tijdvakwijziging voor integratietest.',
  } as any;
  const updateSignature = prognosisSignature(updatePrognosis);
  const location = {
    id: 'coach-test-location',
    name: 'Testwater',
    latitude: 52,
    longitude: 5,
    createdAt: '2026-11-05T09:00:00.000Z',
    updatedAt: '2026-11-05T09:00:00.000Z',
  } as any;
  const updateInput = {
    session,
    prognosis: updatePrognosis,
    currentSignature: updateSignature,
    inputFingerprint: 'coach-test-update-fingerprint-1',
    location,
    durationHours: null,
    weatherInput: [{ time: '2026-11-05T12:00', temperature: 10, pressure: 1015, windSpeed: 8, windDirection: 225, precipitation: 0, precipitationProbability: 0, cloudCover: 40, weatherCode: 1 }] as any,
    inputContext: {} as any,
    previousSnapshot: snapshot,
    previousAdvice: first ?? undefined,
    trigger: 'manual_reanalysis' as const,
  };
  const persisted = await persistCoachReassessment(updateInput);
  assert(persisted.status === 'created', 'Een betekenisvolle sessiewijziging slaat snapshot en advies samen op');
  if (persisted.status === 'created') {
    assert(
      persisted.snapshot.linkedSessionId === session.id &&
      persisted.advice.prognosisSnapshotId === persisted.snapshot.id &&
      persisted.advice.previousAdviceId === first?.id,
      'Tussentijds advies verwijst naar zijn snapshot en het voorgaande advies'
    );
    assert(
      persisted.snapshot.inputFingerprint === updateInput.inputFingerprint &&
      persisted.snapshot.supersedesSnapshotId === snapshot.id,
      'Tussentijdse snapshot bewaart invoerfingerprint en voorganger'
    );
  }
  const snapshotCountAfterPersist = await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count();
  const adviceCountAfterPersist = await db.coachAdviceRecords.where('sessionId').equals(session.id).count();
  const duplicatePersist = await persistCoachReassessment(updateInput);
  assert(
    duplicatePersist.status === 'duplicate' &&
    await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count() === snapshotCountAfterPersist &&
    await db.coachAdviceRecords.where('sessionId').equals(session.id).count() === adviceCountAfterPersist,
    'Dezelfde invoer wordt ook via de database-idempotentie niet dubbel opgeslagen'
  );
  const unchangedPersist = await persistCoachReassessment({
    ...updateInput,
    inputFingerprint: 'coach-test-update-fingerprint-2',
  });
  assert(
    unchangedPersist.status === 'unchanged' &&
    await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count() === snapshotCountAfterPersist,
    'Een nieuwe invoer zonder nieuwe praktische verandering maakt geen extra snapshot of advies'
  );

  const failingPrognosis = { ...updatePrognosis, bestTimeSlot: 'Middag' } as any;
  const originalAdvicePut = db.coachAdviceRecords.put.bind(db.coachAdviceRecords);
  (db.coachAdviceRecords as any).put = async () => {
    throw new Error('Simulated coach-advice persistence failure');
  };
  let atomicFailureCaught = false;
  try {
    await persistCoachReassessment({
      ...updateInput,
      prognosis: failingPrognosis,
      currentSignature: prognosisSignature(failingPrognosis),
      inputFingerprint: 'coach-test-atomic-failure',
    });
  } catch {
    atomicFailureCaught = true;
  } finally {
    (db.coachAdviceRecords as any).put = originalAdvicePut;
  }
  assert(atomicFailureCaught, 'Een fout bij het opslaan van coachadvies wordt doorgegeven');
  assert(
    !(await db.prognosisSnapshots.toArray()).some((item) => item.inputFingerprint === 'coach-test-atomic-failure') &&
    await db.coachAdviceRecords.where('sessionId').equals(session.id).count() === adviceCountAfterPersist,
    'Een mislukte adviesopslag rolt de tussentijdse snapshot terug en laat geen verweesde registratie achter'
  );

  const concurrentPrognosis = { ...updatePrognosis, bestTimeSlot: 'Middag' } as any;
  const concurrentInput = {
    ...updateInput,
    prognosis: concurrentPrognosis,
    currentSignature: prognosisSignature(concurrentPrognosis),
    inputFingerprint: 'coach-test-concurrent-fingerprint',
  };
  const concurrentResults = await Promise.all([
    persistCoachReassessment(concurrentInput),
    persistCoachReassessment(concurrentInput),
  ]);
  const concurrentStatuses = concurrentResults.map((item) => item.status).sort();
  assert(
    concurrentStatuses[0] === 'created' && concurrentStatuses[1] === 'duplicate',
    'Gelijktijdige herbeoordelingen van dezelfde invoer leveren precies één snapshot en advies op'
  );
  assert(
    await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).count() === snapshotCountAfterPersist + 1 &&
    await db.coachAdviceRecords.where('sessionId').equals(session.id).count() === adviceCountAfterPersist + 1,
    'Gelijktijdige dubbele events verhogen snapshot- en adviesaantallen slechts eenmaal'
  );

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
