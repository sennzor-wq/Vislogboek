import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { calculateDayPrognosis, saveSessionWithPrognosisSnapshot } from './src/services/prognosisEngine';
import {
  changedSignatureFactors,
  buildVisCoachAdviceText,
  buildVisCoachBiologicalContext,
  createInitialCoachAdviceRecord,
  getAdviceBaselineSnapshot,
  getSessionUpdateTrigger,
  summarizeCoachSessionOutcome,
  prognosisSignature,
  requiresWeatherConfirmation,
  countsAsWeatherConfirmation,
  updateCoachAdviceFeedback,
  nextWeatherChangeConfirmation,
  persistCoachReassessment,
} from './src/services/sessionCoachService';
import { FishingSession, PrognosisSnapshot } from './src/types';
import { resolveAvailablePrebaitDaysBefore, resolveSelectedTimeSlot } from './src/services/viscoachService';

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

  assert(
    resolveSelectedTimeSlot(new Date('2026-11-05T10:00:00.000Z'), null) === 'Ochtend' &&
    resolveSelectedTimeSlot(new Date('2026-11-05T13:00:00.000Z'), null) === 'Middag' &&
    resolveSelectedTimeSlot(new Date('2026-11-05T19:00:00.000Z'), null) === 'Avond' &&
    resolveSelectedTimeSlot(new Date('2026-11-05T01:00:00.000Z'), null) === 'Nacht',
    'Een starttijd zonder eindtijd wordt aan het juiste Amsterdamse tijdvak gekoppeld'
  );
  assert(
    resolveAvailablePrebaitDaysBefore('2026-11-18', '2026-11-18') === 0 &&
    resolveAvailablePrebaitDaysBefore('2026-11-18', '2026-11-19') === 1 &&
    resolveAvailablePrebaitDaysBefore('2026-11-18', '2026-11-21') === 3 &&
    resolveAvailablePrebaitDaysBefore('2026-11-18', '2026-11-25') === 3 &&
    resolveAvailablePrebaitDaysBefore('ongeldig', '2026-11-21') === 0,
    'VisCoach geeft de voerplanner de werkelijk beschikbare kalenderdagen door, met de bestaande bovengrens van drie dagen'
  );

  const second = await createInitialCoachAdviceRecord(session, snapshot);
  const stored = await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray();

  assert(first !== null, 'Startsnapshot levert een eerste coachadvies op');
  assert(first?.trigger === 'session_start', 'Eerste advies is herkenbaar als sessiestartadvies');

  assert(
    Boolean(first && first.recommendation.toLowerCase().includes('gekozen sessie valt in het tijdvak ochtend') &&
    !first.recommendation.toLowerCase().includes('avond het gunstigste tijdvak')),
    'Opgeslagen startadvies gebruikt het werkelijke sessietijdvak in plaats van de dagwinnaar'
  );
  const multiSlotSession: FishingSession = {
    ...session,
    id: 'coach-multi-slot-session',
    startTime: '2026-11-05T10:00:00.000Z',
    endTime: '2026-11-05T13:00:00.000Z',
  };
  const multiSlotSnapshot: PrognosisSnapshot = {
    ...snapshot,
    id: 'coach-multi-slot-snapshot',
    linkedSessionId: multiSlotSession.id,
    prognosisData: { ...snapshot.prognosisData!, bestTimeSlot: 'Avond' } as any,
  };
  await db.sessions.put(multiSlotSession);
  await db.prognosisSnapshots.put(multiSlotSnapshot);
  const multiSlotStoredAdvice = await createInitialCoachAdviceRecord(multiSlotSession, multiSlotSnapshot);
  assert(
    Boolean(multiSlotStoredAdvice && multiSlotStoredAdvice.recommendation.toLowerCase().includes('meerdere tijdvakken') &&
    !multiSlotStoredAdvice.recommendation.toLowerCase().includes('avond het gunstigste tijdvak')),
    'Opgeslagen advies voor een sessie over meerdere tijdvakken verzint geen dagwinnaar'
  );
  assert(
    buildVisCoachBiologicalContext('Karper').includes('levensfasen') &&
    buildVisCoachBiologicalContext('Karper').includes('niet als vaste tijdvakvoorkeur'),
    'Biologische context benoemt de begrenzing van direct dagritmebewijs zonder een vaste voorkeur te claimen'
  );
  assert(
    buildVisCoachBiologicalContext('Roofblei').includes('geen directe meting van tijdgebonden voedselopname'),
    'Beweging en dieet worden niet verward met directe tijdgebonden voedselopname'
  );

  assert(first?.prognosisSnapshotId === snapshot.id, 'Coachadvies verwijst naar de volledige startsnapshot');
  assert(first?.engineVersions?.waterThermal === '1.0.0' && first.engineVersions.prognosis === '1.0.0',
    'Coachadvies bewaart de volledige engineversiekaart van de gebruikte snapshot');
  assert(second?.id === first?.id && stored.length === 1, 'Herhaald opslaan maakt geen dubbele startadviezen');
  assert(!!first && first.recommendation.length > 0 && first.rationale.length > 0 && Boolean(first.advice?.includes('Wanneer')) && Boolean(first.tactics?.includes('Als het niet werkt')), 'Opgeslagen coachrecord bevat afzonderlijk advies, tactiek en een herleidbare reden');

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
    feedbackSaved?.prognosisSnapshotId === snapshot.id && feedbackSaved?.recommendation === first?.recommendation &&
    feedbackSaved?.advice === first?.advice && feedbackSaved?.tactics === first?.tactics,
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
    translatedAdvice.advice,
    translatedAdvice.tactics,
    translatedAdvice.recommendation,
    translatedAdvice.rationale,
  ].join(' ').toLowerCase();
  assert(
    translatedAdvice.advice.includes('Wanneer') &&
    translatedAdvice.advice.includes('Waar beginnen') &&
    !translatedAdvice.recommendation.includes('Biologische context') &&
    translatedAdvice.tactics.includes('Wind en werprichting') &&
    translatedAdvice.tactics.includes('Voeren en aas') &&
    translatedAdvice.tactics.includes('Als het niet werkt'),
    'Advies en tactiek zijn afzonderlijk, samenhangend en zonder zelfstandig biologisch literatuurblok beschikbaar'
  );
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
  const selectedWindowAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    bestTimeSlot: 'Avond',
    timeSlots: {
      Ochtend: { conclusion: 'De ochtendomstandigheden zijn voor dit tijdvak vergelijkbaar.' },
      Avond: { conclusion: 'De avond heeft in dit voorbeeld een andere context.' },
    },
  } as any, null, null, 'Ochtend');
  const selectedWindowText = [
    selectedWindowAdvice.summary,
    selectedWindowAdvice.recommendation,
    selectedWindowAdvice.rationale,
  ].join(' ').toLowerCase();
  assert(
    selectedWindowText.includes('gekozen sessie valt in het tijdvak ochtend') &&
    selectedWindowText.includes('ochtendomstandigheden') &&
    !selectedWindowText.includes('avond het gunstigste tijdvak'),
    'VisCoach gebruikt de analyse van het gekozen tijdvak en niet het beste tijdvak van de hele dag'
  );

  const multiWindowAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    bestTimeSlot: 'Avond',
  } as any, null, null, null);
  const multiWindowText = [
    multiWindowAdvice.summary,
    multiWindowAdvice.recommendation,
    multiWindowAdvice.rationale,
  ].join(' ').toLowerCase();
  assert(
    multiWindowText.includes('meerdere tijdvakken') &&
    !multiWindowText.includes('avond het gunstigste tijdvak'),
    'VisCoach verzint geen enkele winnaar wanneer de geplande sessie meerdere tijdvakken bestrijkt'
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
      windContext: { directionText: 'Noord', speedKmH: 5, isStrongWind: false, isCalmWind: true, isColdWind: false },
    },
  } as any);
  assert(
    !calmAdvice.tactics.includes('Wind en werprichting'),
    'Bij zwakke wind wordt geen onnodig wind- of werprichtingadvies getoond'
  );
  const calmWindKnownZoneAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    habitatAnalysis: {
      primaryZone: { name: 'Diepere taludzone', habitatType: 'Overgangszone', description: 'Diepere overgang.', depthProfileNote: 'Lokaal peilen.', structureNote: 'Talud', whyLikely: 'Geregistreerd talud.' },
      confidenceLevel: 'Redelijk',
      dataProvenance: { measuredDataPoints: [], userObservations: [], modelInferences: [] },
    },
    positioningAdvice: {
      recommendedZone: 'Algemene zoekzone',
      windContext: { directionText: 'Noord', speedKmH: 5, isStrongWind: false, isCalmWind: true, isColdWind: false },
    },
  } as any);
  assert(
    calmWindKnownZoneAdvice.tactics.includes('Wind en werprichting') &&
    calmWindKnownZoneAdvice.tactics.includes('Er staat weinig wind') &&
    calmWindKnownZoneAdvice.tactics.includes('een dieper en rustiger deel van het water') &&
    !calmWindKnownZoneAdvice.tactics.includes('werprichting Noord'),
    'Bij weinig wind geeft VisCoach wel een doelzone, maar verzint geen windgestuurde kompasrichting'
  );
  const unknownWindAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    positioningAdvice: {
      recommendedZone: 'Algemene zoekzone',
      windContext: { directionText: 'Onbekend', speedKmH: null, isStrongWind: false, isColdWind: false },
    },
    bankWindAnalysis: undefined,
  } as any);
  assert(
    !unknownWindAdvice.tactics.includes('Wind en werprichting'),
    'Ontbrekende windgegevens worden niet als matige wind of concreet tactisch signaal behandeld'
  );

  const moderateWindAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    positioningAdvice: {
      recommendedZone: 'Algemene zoekzone',
      windContext: { directionText: 'Zuidwest', speedKmH: 15, isStrongWind: false, isCalmWind: false, isColdWind: false },
    },
    bankWindAnalysis: {
      isConfigured: true,
      windOriginDirection: 'Zuidwest',
      windDestinationDirection: 'Noordoost',
      windSpeedKmH: 15,
      rodPlacementAdvice: { primaryPosition: 'Kies de oever met voldoende ruimte voor een veilige presentatie.', castingDirectionAdvice: 'Vis schuin langs de aanlandige oever.' },
      bankAssessment: { explanation: 'De wind kan voedsel richting deze oever verplaatsen.' },
      missingInformation: [],
      fieldChecklist: [],
    },
  } as any);
  assert(
    moderateWindAdvice.tactics.includes('Wind en werprichting') &&
    moderateWindAdvice.tactics.includes('De wind kan de oeverkeuze en werprichting beïnvloeden.'),
    'Ook matige wind krijgt tactische aandacht wanneer de bestaande oeveranalyse is geconfigureerd'
  );
  const moderateWindTargetAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    habitatAnalysis: {
      primaryZone: { name: 'Diepere taludzone', habitatType: 'Overgangszone', description: 'Diepere overgang.', depthProfileNote: 'Lokaal peilen.', structureNote: 'Talud', whyLikely: 'Geregistreerd talud.' },
      confidenceLevel: 'Redelijk',
      dataProvenance: { measuredDataPoints: [], userObservations: [], modelInferences: [] },
    },
    positioningAdvice: {
      recommendedZone: 'Algemene zoekzone',
      windContext: { directionText: 'Zuidwest', speedKmH: 15, isStrongWind: false, isCalmWind: false, isColdWind: false },
    },
    bankWindAnalysis: {
      isConfigured: false,
      windOriginDirection: 'Zuidwest',
      windDestinationDirection: 'Noordoost',
      windSpeedKmH: 15,
      rodPlacementAdvice: { primaryPosition: 'Oeveroriëntatie onbekend.', castingDirectionAdvice: 'Geen exacte richting.' },
      bankAssessment: { explanation: 'Windcontext.' },
      missingInformation: ['Oeveroriëntatie onbekend.'],
      fieldChecklist: [],
    },
  } as any);
  assert(
    moderateWindTargetAdvice.tactics.includes('De windrichting helpt je werphoek en lijncontrole bepalen, maar bepaalt niet automatisch waar de vis ligt.') &&
    moderateWindTargetAdvice.tactics.includes('Houd een dieper en rustiger deel van het water als doelzone'),
    'Bij matige wind blijft de gekozen habitatdoelzone leidend en wordt wind alleen voor de werphoek gebruikt'
  );
  const habitatWindConflictAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    habitatAnalysis: {
      primaryZone: { name: 'Diepere taludzone', habitatType: 'Holding / rustzone', description: 'Diepere overgang langs het talud.', depthProfileNote: 'Diepte lokaal peilen.', structureNote: 'Talud', whyLikely: 'De lokale habitatgegevens ondersteunen een dieper talud.' },
      alternativeZone: { name: 'Rietkraag', habitatType: 'Structuurzone', description: 'Rietrand.', depthProfileNote: 'Onbekend.', structureNote: 'Riet', whyLikely: 'Alternatieve structuur.' },
      movementHypothesis: { likelyDirection: '', migrationalTrigger: '', timeOfDayDynamic: '', transitRoute: '', windInfluence: '', seasonalPattern: '' },
      environmentalInfluence: { temperatureImpact: '', windAndWaveImpact: '', pressureTrendImpact: '', lightAndSolarImpact: '' },
      confidenceLevel: 'Redelijk',
      dataProvenance: { measuredDataPoints: [], userObservations: [], modelInferences: [] },
      missingInformation: [],
    },
    positioningAdvice: {
      recommendedZone: 'Aanlandige oeverzone (windkant)',
      rationale: 'De wind-/positioneringsanalyse wijst op de aanlandige oever.',
      alternativeOption: 'Vergelijk de luwere overgangszone.',
      confidenceLevel: 'Redelijk',
      windContext: { directionText: 'Zuidwest', speedKmH: 15, isStrongWind: false, isCalmWind: false, isColdWind: false },
    },
  } as any);
  assert(
    habitatWindConflictAdvice.advice.includes('Begin bij een dieper en rustiger deel van het water.') &&
    habitatWindConflictAdvice.advice.includes('Aanlandige oeverzone (windkant)') &&
    habitatWindConflictAdvice.advice.includes('tweede zoekzone'),
    'Bij een verschil tussen lokale habitat en windpositionering kiest de coach één startzone en houdt de andere als alternatief'
  );
  const observedZoneAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    habitatAnalysis: {
      primaryZone: { name: 'Actieve waarnemingszone (visvisuele hotspot)', habitatType: 'Foerageerzone', description: 'Zone met eigen viswaarneming.', depthProfileNote: 'Onbekend.', structureNote: 'Ter plaatse vaststellen.', whyLikely: 'Ondersteund door jouw eigen recente visuele waarnemingen aan het water.' },
      alternativeZone: { name: 'Direct aangrenzende zoekzone', habitatType: 'Doorgang / transitie', description: 'Aangrenzende zone.', depthProfileNote: 'Onbekend.', structureNote: 'Ter plaatse vaststellen.', whyLikely: 'Vergelijkingszone.' },
      movementHypothesis: { likelyDirection: '', migrationalTrigger: '', timeOfDayDynamic: '', transitRoute: '', windInfluence: '', seasonalPattern: '' },
      environmentalInfluence: { temperatureImpact: '', windAndWaveImpact: '', pressureTrendImpact: '', lightAndSolarImpact: '' },
      confidenceLevel: 'Laag',
      dataProvenance: { measuredDataPoints: [], userObservations: ['Bellen waargenomen in een eerdere sessie'], modelInferences: [] },
      missingInformation: [],
    },
    positioningAdvice: { recommendedZone: 'Aanlandige oeverzone (windkant)', confidenceLevel: 'Redelijk', rationale: 'Windpositie.' },
  } as any);
  assert(
    observedZoneAdvice.advice.includes('Begin bij Actieve waarnemingszone (visvisuele hotspot)'),
    'Een eigen lokale viswaarneming blijft leidend boven een algemene wind-/positioneringshypothese'
  );
  const positioningPriorityAdvice = buildVisCoachAdviceText({
    ...baselinePrognosis,
    habitatAnalysis: {
      primaryZone: { name: 'Diepere taludzone', habitatType: 'Holding / rustzone', description: 'Dieper talud.', depthProfileNote: 'Onbekend.', structureNote: 'Talud', whyLikely: 'Voorlopige habitatinschatting.' },
      alternativeZone: { name: 'Rietkraag', habitatType: 'Structuurzone', description: 'Rietrand.', depthProfileNote: 'Onbekend.', structureNote: 'Riet', whyLikely: 'Alternatief.' },
      movementHypothesis: { likelyDirection: '', migrationalTrigger: '', timeOfDayDynamic: '', transitRoute: '', windInfluence: '', seasonalPattern: '' },
      environmentalInfluence: { temperatureImpact: '', windAndWaveImpact: '', pressureTrendImpact: '', lightAndSolarImpact: '' },
      confidenceLevel: 'Laag',
      dataProvenance: { measuredDataPoints: [], userObservations: [], modelInferences: [] },
      missingInformation: [],
    },
    positioningAdvice: { recommendedZone: 'Aanlandige oeverzone (windkant)', confidenceLevel: 'Redelijk', rationale: 'De positioneringsanalyse heeft hier redelijke onderbouwing.' },
  } as any);
  assert(
    positioningPriorityAdvice.advice.includes('Begin bij Aanlandige oeverzone (windkant)') &&
    positioningPriorityAdvice.advice.includes('dieper en rustiger deel van het water'),
    'Bij lage habitatzekerheid en redelijke positioneringszekerheid krijgt de positioneringszone voorrang, met de habitat als alternatief'
  );

  const confidentPrebaitPlan = {
    suitability: 'Zeer zinvol',
    suitabilityScore: 8,
    shouldPrebait: true,
    recommendedDaysBefore: 2,
    totalAmountGrams: 500,
    campaignSummary: 'Een bescheiden campagne van één tot twee dagen kan zinvol zijn; bouw rustig op.',
    biologicalRationale: 'Niet tonen in het standaardplan.',
    temperatureFactorExplanation: 'Niet tonen in het standaardplan.',
    moments: [
      { dayOffset: -1, date: '2026-07-19', dayLabel: '1 dag vooraf', suggestedTime: 'Avond', feedType: 'Pellets', amountGrams: 250, amountDisplay: 'circa 250 gram', purpose: 'Kleine voerbeurt.' },
      { dayOffset: 0, date: '2026-07-20', dayLabel: 'Visdag zelf', suggestedTime: 'Tijdens de sessie', feedType: 'Instant', amountGrams: 100, amountDisplay: 'circa 100 gram', purpose: 'Sessiepresentatie.' },
    ],
    sessionDayGuidance: { feedDuringSession: true, recommendedAmountGrams: 100, amountDisplay: 'circa 100 gram', advice: 'Begin met een kleine portie en voer alleen bij wanneer aanbeten of vangsten daar aanleiding toe geven.' },
    feedCompositionAdvice: { recommendedMix: 'Een kleine mix van pellets en boiliekruim', digestibilityNote: 'Niet tonen.', particleSizeNote: 'Niet tonen.' },
    confidenceLevel: 'Redelijk',
    missingInformation: [],
    personalEvidence: { hasSufficientData: true, totalRelevantSessions: 8, relevantPrebaitedSessionsCount: 4, catchRateWithPrebait: 1.5, catchRateWithoutPrebait: 0.8, summaryNote: 'In acht vergelijkbare sessies was de vangstsnelheid hoger met voorvoeren.' },
    methodFeederGuidance: 'Method feeder blijft een instant presentatie; houd de korfvulling apart van vooraf gevoerd aas.',
  };
  const prebaitTactics = buildVisCoachAdviceText({ ...baselinePrognosis, prebaitPlan: confidentPrebaitPlan } as any, null, 'Method feeder', 'Avond', 3);
  assert(
    prebaitTactics.tactics.includes('Voorvoeren: Een bescheiden campagne') &&
    prebaitTactics.tactics.includes('circa 100 gram') &&
    prebaitTactics.tactics.includes('1 dag vooraf: circa 250 gram') &&
    prebaitTactics.tactics.includes('Voersamenstelling: Een kleine mix') &&
    prebaitTactics.tactics.includes('Eigen sessiehistorie:') &&
    prebaitTactics.tactics.includes('Method feeder blijft een instant presentatie') &&
    !prebaitTactics.tactics.includes('Niet tonen in het standaardplan') &&
    !prebaitTactics.tactics.includes('Niet tonen.'),
    'De coach vertaalt campagne, sessievoer, mix en voldoende persoonlijke historie naar praktische tactiek'
  );
  const noPrebaitTactics = buildVisCoachAdviceText({
    ...baselinePrognosis,
    prebaitPlan: {
      ...confidentPrebaitPlan,
      suitability: 'Niet aanbevolen (instant vissen aanbevolen)',
      shouldPrebait: false,
      campaignSummary: 'Niet voorvoeren. Kies voor een puur instant tactiek met minimaal haakaas.',
      moments: [],
      sessionDayGuidance: { feedDuringSession: false, recommendedAmountGrams: 0, amountDisplay: 'Geen extra voer', advice: 'Niet bijvoeren. Gebruik een kleine single hookbait of micro-PVA-presentatie vlak bij de haak.' },
      feedCompositionAdvice: { recommendedMix: 'Geen voorvoermengsel; alleen minimaal haakaas.', digestibilityNote: '', particleSizeNote: '' },
      personalEvidence: { ...confidentPrebaitPlan.personalEvidence, hasSufficientData: false },
    },
  } as any, null, null, 'Avond', null);
  assert(
    noPrebaitTactics.tactics.includes('Niet voorvoeren. Kies voor een puur instant tactiek') &&
    !noPrebaitTactics.tactics.includes('Voorvoeren niet aanbevolen: Niet voorvoeren'),
    'Wanneer voorvoeren niet passend is, adviseert de coach expliciet een instant presentatie zonder dubbele formulering'
  );
  const uncertainPrebaitTactics = buildVisCoachAdviceText({
    ...baselinePrognosis,
    prebaitPlan: {
      ...confidentPrebaitPlan,
      confidenceLevel: 'Matig',
      personalEvidence: { ...confidentPrebaitPlan.personalEvidence, hasSufficientData: false },
    },
  } as any, null, null, 'Avond', 3);
  assert(
    !uncertainPrebaitTactics.tactics.includes('circa 100 gram') &&
    !uncertainPrebaitTactics.tactics.includes('circa 250 gram') &&
    uncertainPrebaitTactics.tactics.includes('De exacte hoeveelheid is nog onzeker'),
    'Exacte voerhoeveelheden worden alleen getoond bij voldoende invoerkwaliteit'
  );
  assert(
    uncertainPrebaitTactics.tactics.includes('1 dag vooraf (Avond)') &&
    !uncertainPrebaitTactics.tactics.includes('1 dag vooraf: circa 250 gram'),
    'Bij matige invoerkwaliteit blijft de aanbevolen voorbereidingstiming zichtbaar, maar worden grammen verborgen'
  );
  const incompleteColdPrebait = buildVisCoachAdviceText({
    ...baselinePrognosis,
    species: 'Karper',
    prebaitPlan: {
      ...confidentPrebaitPlan,
      suitability: 'Beperkt / voorzichtig',
      shouldPrebait: false,
      recommendedDaysBefore: 0,
      campaignSummary: 'Geen voorvoerbeurt ingepland: het watertype ontbreekt in de opgeslagen gegevens van deze stek. Daarom geef ik geen betrouwbaar voerschema of exacte hoeveelheid.',
      temperatureFactorExplanation: 'Bij 7.8 °C zijn voedselopname en vertering doorgaans lager.',
      moments: [{ dayOffset: 0, date: '2026-11-21', dayLabel: 'Visdag zelf', suggestedTime: 'Tijdens de sessie', feedType: 'Instant', amountGrams: 0, amountDisplay: 'Geen extra voer', purpose: 'Minimale presentatie.' }],
      sessionDayGuidance: { feedDuringSession: false, recommendedAmountGrams: 0, amountDisplay: 'Geen extra voer', advice: 'Houd de presentatie klein en direct rond het haakaas. Zonder watertype en voldoende bodemcontext geef ik geen exacte grammen of bulkvoeradvies.' },
      confidenceLevel: 'Laag',
      missingInformation: ['Watertype ontbreekt; stroming, bodem en natuurlijke voedselbeschikbaarheid kunnen de passende hoeveelheid beïnvloeden.'],
    },
  } as any, null, null, 'Avond', 3);
  assert(
    incompleteColdPrebait.tactics.includes('watertype ontbreekt in de opgeslagen gegevens van deze stek') &&
    !incompleteColdPrebait.tactics.toLowerCase().includes('kies eerst een stek') &&
    incompleteColdPrebait.tactics.includes('klein PVA-zakje') &&
    incompleteColdPrebait.tactics.includes('method feeder') &&
    incompleteColdPrebait.tactics.includes('Dit zijn alternatieven, geen combinatie') &&
    !incompleteColdPrebait.tactics.includes('circa 100 gram'),
    'Bij koud, onzeker water geeft VisCoach een bruikbare instant-keuze zonder nieuwe stek te eisen of grammen te verzinnen'
  );
  const unknownTemperatureCarp = buildVisCoachAdviceText({
    ...baselinePrognosis,
    species: 'Karper',
    prebaitPlan: {
      ...confidentPrebaitPlan,
      suitability: 'Niet aanbevolen (instant vissen aanbevolen)',
      shouldPrebait: false,
      temperatureFactorExplanation: 'Onbekend: er is geen bruikbare gemeten of geschatte watertemperatuur.',
      sessionDayGuidance: { feedDuringSession: false, recommendedAmountGrams: 0, amountDisplay: 'Geen extra voer', advice: 'Geen bulkvoeradvies. Kies ter plaatse een kleine, doelgerichte presentatie en beoordeel activiteit en aanbeten.' },
    },
  } as any, null, null, 'Avond', 3);
  const unavailableScoreAdvice = buildVisCoachAdviceText({ ...baselinePrognosis, activityScoreAvailable: false, advice: 'Gemiddeld', thermalAnalysis: { hasMeasuredWaterTemp: false, measuredWaterTemp: null, estimatedWaterTemp: null } } as any, null, null, 'Avond', 3);
  assert(!unavailableScoreAdvice.summary.toLowerCase().includes('gemiddeld') && unavailableScoreAdvice.summary.includes('Geen betrouwbare activiteitsscore beschikbaar'), 'VisCoach presenteert de interne gemiddelde placeholder niet als prognose wanneer thermische schatting ontbreekt');
  assert(
    !unknownTemperatureCarp.tactics.includes('klein PVA-zakje') &&
    !unknownTemperatureCarp.tactics.includes('method feeder een minimaal'),
    'Een ontbrekende watertemperatuur wordt niet aangezien voor bewezen koudwatercondities'
  );
  const unknownDurationPrebait = buildVisCoachAdviceText({ ...baselinePrognosis, prebaitPlan: confidentPrebaitPlan } as any, null, 'Method feeder', 'Avond', null);
  assert(
    !unknownDurationPrebait.tactics.includes('circa 100 gram') &&
    unknownDurationPrebait.tactics.includes('1 dag vooraf: circa 250 gram'),
    'Sessiehoeveelheid blijft verborgen zonder eindtijd, terwijl een voldoende onderbouwd voorvoerschema zichtbaar blijft'
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

  assert(requiresWeatherConfirmation('weather_update'), 'Automatische forecast-refresh valt onder de voorzichtige weersbeoordeling');
  assert(requiresWeatherConfirmation('app_resume'), 'App-hervatten wordt opnieuw beoordeeld met de voorzichtige weerslogica');
  assert(countsAsWeatherConfirmation('weather_update'), 'Een nieuwe forecast-refresh mag een weerskandidaat bevestigen');
  assert(!countsAsWeatherConfirmation('app_resume'), 'App-hervatten telt nooit als tweede weersbevestiging');
  const candidateSignature = prognosisSignature(meaningfulTacticalChange);
  const pendingBeforeResume = nextWeatherChangeConfirmation(undefined, candidateSignature);
  const pendingAfterResume = countsAsWeatherConfirmation('app_resume')
    ? nextWeatherChangeConfirmation(pendingBeforeResume, candidateSignature)
    : pendingBeforeResume;
  assert(
    pendingAfterResume.confirmations === 1,
    'Een app-hervatting laat het aantal bevestigingen van een bestaande kandidaat ongewijzigd'
  );
  const confirmedAfterNewForecast = nextWeatherChangeConfirmation(pendingAfterResume, candidateSignature);
  assert(
    confirmedAfterNewForecast.confirmations === 2,
    'Pas een volgende afwijkende forecast-refresh kan dezelfde kandidaat bevestigen'
  );
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
    inputContext: { targetTimeSlot: 'Avond' } as any,
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
      persisted.snapshot.supersedesSnapshotId === snapshot.id &&
      persisted.snapshot.inputContext?.targetTimeSlot === 'Avond',
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

  const slotForecasts = Array.from({ length: 24 }, (_, hour) => ({
    time: `2026-07-20T${String(hour).padStart(2, '0')}:00:00`,
    temperature: 20,
    relativeHumidity: 70,
    dewPoint: 14,
    shortwaveRadiation: hour >= 6 && hour < 18 ? 150 : 0,
    pressure: 1013,
    windSpeed: hour < 6 ? 2 : hour < 12 ? 4 : hour < 18 ? 8 : 18,
    windDirection: 180,
    windDirectionText: 'Zuid',
    precipitation: 0,
    precipitationProbability: 0,
    cloudCover: 40,
    weatherCode: 1,
  }));
  const slotLocation = {
    id: 'coach-slot-location',
    name: 'Tijdvaktestwater',
    latitude: 51.9,
    longitude: 5.2,
    waterType: 'Plas/Zandafgraving',
    waterDepth: 2,
    waterFacingDirection: 'Noord',
    habitatFeatures: ['open_water', 'talud'],
  } as any;
  const slotNow = new Date('2026-07-20T00:00:00+02:00');
  const slotBaseOptions = {
    sessionDurationHours: 4,
    allowUnknownSessionDuration: true,
    locationId: slotLocation.id,
    location: slotLocation,
    catches: [],
    prebaitOptions: { availableDaysBefore: 2, planningDate: '2026-07-20' },
  };
  const dayWidePrognosis = calculateDayPrognosis(
    '2026-07-20', slotForecasts, 'Karper', [], '2026-07-19T21:00:00.000Z', 20, slotNow, slotBaseOptions
  );
  const selectedEveningPrognosis = calculateDayPrognosis(
    '2026-07-20', slotForecasts, 'Karper', [], '2026-07-19T21:00:00.000Z', 20, slotNow,
    { ...slotBaseOptions, targetTimeSlot: 'Avond' }
  );
  assert(
    dayWidePrognosis.bestTimeSlot === selectedEveningPrognosis.bestTimeSlot,
    'Het gekozen VisCoach-starttijdvak verandert de dagbrede beste-tijdvakprognose niet'
  );
  assert(
    dayWidePrognosis.bankWindAnalysis?.windSpeedKmH === 8 &&
    selectedEveningPrognosis.bankWindAnalysis?.windSpeedKmH === 18,
    'De VisCoach-oeverwindanalyse gebruikt het gekozen tijdvak in plaats van het daggemiddelde'
  );
  assert(
    selectedEveningPrognosis.positioningAdvice?.windContext.speedKmH === 18,
    'De hengelpositionering gebruikt de wind van het gekozen starttijdvak'
  );
  const partialEveningForecasts = slotForecasts.filter((forecast) => Number(forecast.time.slice(11, 13)) >= 20);
  const partialEveningPrognosis = calculateDayPrognosis(
    '2026-07-20', partialEveningForecasts, 'Karper', [], '2026-07-20T17:00:00.000Z', 20,
    new Date('2026-07-20T20:00:00+02:00'),
    { ...slotBaseOptions, targetTimeSlot: 'Avond' }
  );
  assert(
    partialEveningPrognosis.positioningAdvice?.missingInformation.includes(
      'De tactische weersanalyse gebruikt alleen de resterende beschikbare uren van het gekozen tijdvak; een volledig tijdvakgemiddelde is niet beschikbaar.'
    ) ?? false,
    'Een onvolledig resterend tijdvak wordt expliciet als beperkte tactische weersdekking gemeld'
  );

  await db.delete();
  console.log(`Session coach tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
