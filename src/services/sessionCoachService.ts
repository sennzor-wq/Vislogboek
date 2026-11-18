import { db } from '../db/db';
import {
  CoachAdviceRecord,
  CoachAdviceResponse,
  CoachAdviceTrigger,
  DayPrognosis,
  FishSpecies,
  FishingLocation,
  FishingSession,
  PrognosisSnapshot,
  PrognosisInputContext,
  TimeSlot,
} from '../types';
import { calculateDayPrognosis, createPrognosisHistoryFeatureSnapshot, createPrognosisHistoryFingerprint, createPrognosisInputFingerprint, getSessionDurationHours, savePrognosisSnapshot } from './prognosisEngine';
import { getForecast } from './weatherService';
import { getWaterTemperatureCalibration } from './evaluationEngine';
import { collectHistoricalWaterTemperatureObservations } from './waterTemperatureHistory';
import { getSpeciesFeedingEvidenceContext } from './feedingEvidenceService';
import { getSpeciesDielBehaviorEvidenceContext } from './dielBehaviorEvidenceService';
import { resolveSelectedTimeSlot } from './viscoachService';

export interface SessionCoachReassessmentResult {
  sessionId: string;
  status: 'skipped' | 'unchanged' | 'snapshot_created';
  snapshotId?: string;
  adviceId?: string;
  reason?: string;
}

export interface PersistCoachReassessmentInput {
  session: FishingSession;
  prognosis: DayPrognosis;
  currentSignature: Record<string, string | number | null>;
  inputFingerprint: string;
  location: FishingLocation;
  durationHours: number | null;
  weatherInput: NonNullable<PrognosisSnapshot['weatherInput']>;
  inputContext: PrognosisInputContext;
  previousSnapshot: PrognosisSnapshot;
  previousAdvice?: CoachAdviceRecord;
  trigger: CoachAdviceTrigger;
}

export type PersistCoachReassessmentResult =
  | { status: 'duplicate' | 'missing_baseline' | 'unchanged' }
  | { status: 'created'; snapshot: PrognosisSnapshot; advice: CoachAdviceRecord };

const lastEvaluatedFingerprint = new Map<string, string>();
const sessionsBeingReassessed = new Set<string>();
const pendingWeatherChanges = new Map<string, { signature: string; confirmations: number }>();


/**
 * Alleen uitkomsten die de praktische aanpak kunnen veranderen horen in de
 * adviesvergelijking. Ruwe scores, percentages en vrije toelichting blijven
 * bewust buiten deze signature: kleine model-/afrondingsschommelingen mogen
 * geen nieuw sessieadvies veroorzaken.
 */
export function prognosisSignature(prognosis: DayPrognosis): Record<string, string | number | null> {
  return {
    advice: prognosis.advice,
    bestTimeSlot: prognosis.bestTimeSlot,
    recommendedZone: prognosis.positioningAdvice?.recommendedZone ?? null,
    bankWindRelation: prognosis.bankWindAnalysis?.relation ?? null,
    bankWindPosition: prognosis.bankWindAnalysis?.rodPlacementAdvice?.primaryPosition ?? null,
    habitatZone: prognosis.habitatAnalysis?.primaryZone?.name ?? null,
    prebaitSuitability: prognosis.prebaitPlan?.suitability ?? null,
  };
}

export function changedSignatureFactors(
  previous: Record<string, string | number | null>,
  current: Record<string, string | number | null>
): string[] {
  return Object.keys(current).filter((key) => previous[key] !== current[key]);
}

/**
 * Autonome forecast-refreshes en hervatten na app-heropenen vallen onder de
 * voorzichtige weersbeoordeling. Alleen een nieuwe forecast-refresh mag een
 * kandidaat bevestigen; app_resume is uitsluitend een herbeoordeling.
 */
export function requiresWeatherConfirmation(trigger: CoachAdviceTrigger): boolean {
  return trigger === 'weather_update' || trigger === 'app_resume';
}

/** Hervatten van de app is nooit een tweede, onafhankelijke weersbevestiging. */
export function countsAsWeatherConfirmation(trigger: CoachAdviceTrigger): boolean {
  return trigger === 'weather_update';
}

/**
 * Onderscheidt expliciete waarnemings-/meetupdates van gewone sessiebewerkingen.
 * Alleen bestaande, daadwerkelijk gewijzigde observatievelden bepalen de trigger.
 */
export function getSessionUpdateTrigger(
  previous: FishingSession | undefined,
  current: FishingSession
): CoachAdviceTrigger {
  if (!previous) return 'session_changed';

  const normalizeObservations = (values: FishingSession['presenceObservations']) =>
    [...(values ?? [])].sort().join('|');
  const observationChanged =
    normalizeObservations(previous.presenceObservations) !== normalizeObservations(current.presenceObservations);

  const measurementFields: Array<keyof FishingSession> = [
    'waterTemperature',
    'waterTemperatureMeasuredAt',
    'waterTemperatureMeasurementSource',
    'waterTemperatureMeasurementMethod',
    'waterTemperatureMeasurementDepthM',
  ];
  const measurementChanged = measurementFields.some((field) => previous[field] !== current[field]);

  return observationChanged || measurementChanged ? 'observation_recorded' : 'session_changed';
}

/**
 * Beschrijft de geregistreerde sessie-uitkomst zonder vangst van een bijvangst
 * of een onbekende legacy-soort als doelsoortsucces te tellen.
 */
export function summarizeCoachSessionOutcome(
  session: FishingSession,
  catches: import('../types').CatchItem[]
): string {
  if (session.outcome === 'skunk_confirmed') return 'Bevestigde nulvangst';

  const targetSpecies = session.targetSpecies ?? [];
  const targetCatches = catches.filter((item) =>
    item.legacyImportQuality?.speciesKnown !== false && targetSpecies.includes(item.species)
  );
  const knownTargetCount = targetCatches.reduce((sum, item) =>
    sum + (item.legacyImportQuality?.countKnown === false ? 0 : item.count), 0
  );
  const targetCountUnknown = targetCatches.some((item) => item.legacyImportQuality?.countKnown === false);

  if (targetCatches.length > 0) {
    if (knownTargetCount > 0) {
      return `Doelsoort geregistreerd: ${knownTargetCount} vis${knownTargetCount === 1 ? '' : 'sen'}`;
    }
    return targetCountUnknown
      ? 'Doelsoort geregistreerd; aantal onbekend'
      : 'Doelsoortregistratie aanwezig; aantal niet betrouwbaar bekend';
  }

  if (session.outcome === 'catch') {
    if (targetSpecies.length === 0) return 'Vangst geregistreerd; doelsoort niet vastgelegd';
    if (catches.some((item) => item.legacyImportQuality?.speciesKnown === false)) {
      return 'Vangst geregistreerd; doelsoortresultaat deels onbekend';
    }
    if (catches.length > 0) return 'Andere soort(en) geregistreerd; geen doelsoortvangst vastgelegd';
    return 'Sessie als vangst gemarkeerd; soortspecifieke vangst ontbreekt';
  }

  return session.outcome === 'unknown' ? 'Uitkomst onbekend' : 'Sessie niet afgerond';
}

export interface WeatherChangeConfirmationState {
  signature: string;
  confirmations: number;
}

/** Dezelfde kandidaat wordt bevestigd; een andere kandidaat begint opnieuw bij één. */
export function nextWeatherChangeConfirmation(
  previous: WeatherChangeConfirmationState | undefined,
  currentSignature: Record<string, string | number | null>
): WeatherChangeConfirmationState {
  const signature = JSON.stringify(currentSignature);
  return {
    signature,
    confirmations: previous?.signature === signature ? previous.confirmations + 1 : 1,
  };
}

export interface VisCoachAdviceText {
  summary: string;
  advice: string;
  tactics: string;
  /** Samengestelde compatibiliteitstekst voor bestaande opgeslagen records. */
  recommendation: string;
  rationale: string;
}

function cleanCoachText(value: string | undefined): string {
  return (value ?? '')
    .split(String.fromCharCode(10)).join(' ')
    .split(String.fromCharCode(13)).join(' ')
    .split(String.fromCharCode(9)).join(' ')
    .trim();
}
function isGenericZone(value: string): boolean {
  return /algemene zoekzone|bekende lokale structuurzone|geregistreerde lokale structuur als eerste zoekzone|aanvullende locatiegegevens|ter plaatse vaststellen|zie steknotities|onbekend/i.test(value);
}

function explainZone(value: string): string {
  const normalized = value.toLowerCase();
  if (/overgang/.test(normalized)) return 'de overgang waar ondieper water overgaat in dieper water';
  if (/diep|rustzone|holding/.test(normalized)) return 'een dieper en rustiger deel van het water';
  if (/riet/.test(normalized)) return 'de rietkraag, als die op deze stek aanwezig is';
  if (/structuur/.test(normalized)) return 'een plek waar je ter plaatse duidelijke structuur ziet, bijvoorbeeld begroeiing of een verandering in de bodem';
  return value;
}

function resolveCoachStartZone(
  habitat: DayPrognosis['habitatAnalysis'],
  positioning: DayPrognosis['positioningAdvice']
) {
  const habitatName = habitat?.primaryZone?.name;
  const structureNote = habitat?.primaryZone?.structureNote;
  const habitatZone = habitatName && !isGenericZone(habitatName)
    ? habitatName
    : structureNote && !isGenericZone(structureNote)
      ? `Geregistreerde structuur: ${structureNote}`
      : null;
  const positioningZone = positioning?.recommendedZone && !isGenericZone(positioning.recommendedZone)
    ? positioning.recommendedZone
    : null;
  const hasLocalObservationEvidence = (habitat?.dataProvenance?.userObservations?.length ?? 0) > 0 || /actieve waarnemingszone|visuele hotspot/i.test(habitatName ?? '');
  // Directe lokale waarnemingen en een bruikbaar habitatprofiel gaan vóór een
  // generieke wind-/soortzone. Alleen bij lage habitatzekerheid en redelijke
  // positioneringszekerheid krijgt de positioneringszone voorrang.
  const preferPositioning = Boolean(positioningZone) && (
    !habitatZone ||
    (!hasLocalObservationEvidence && habitat?.confidenceLevel === 'Laag' && positioning?.confidenceLevel === 'Redelijk')
  );
  const primaryZone = preferPositioning ? positioningZone : habitatZone ?? positioningZone;
  const secondaryCandidate = preferPositioning ? habitatZone : positioningZone;
  const sameZone = Boolean(primaryZone && secondaryCandidate && primaryZone.trim().toLowerCase() === secondaryCandidate.trim().toLowerCase());
  const secondaryZone = sameZone ? null : secondaryCandidate;
  const source = preferPositioning ? 'positioning' : habitatZone ? 'habitat' : positioningZone ? 'positioning' : 'none';
  const confidenceLevel = source === 'habitat' ? habitat?.confidenceLevel : source === 'positioning' ? positioning?.confidenceLevel : undefined;
  const explanation = source === 'habitat'
    ? cleanCoachText(habitat?.primaryZone?.whyLikely || habitat?.primaryZone?.description)
    : source === 'positioning'
      ? cleanCoachText(positioning?.rationale)
      : '';
  return { primaryZone, secondaryZone, source, confidenceLevel, hasLocalObservationEvidence, explanation };
}

function explainCoachLimitation(note: string): string | null {
  if (/vergelijkbare eigen sessies/i.test(note)) {
    const count = note.split(' ').find((part) => part.length > 0 && Number.isInteger(Number(part)));
    return count
      ? `Er zijn ${count} vergelijkbare eigen sessies. Dat is nog te weinig om jouw persoonlijke vangkans betrouwbaar te berekenen.`
      : 'Er zijn nog te weinig vergelijkbare eigen sessies om jouw persoonlijke vangkans betrouwbaar te berekenen.';
  }
  if (/oeverlijnoriëntatie|oeveroriëntatie|GPS is een enkel punt/i.test(note)) {
    return 'De richting en vorm van de oever zijn niet vastgelegd. Daarom kan ik geen exacte windkant of werprichting aanwijzen.';
  }
  if (/watertemperatuur is niet gemeten|geschatte watertemperatuur/i.test(note)) {
    return 'De watertemperatuur is geschat en niet op deze stek gemeten. Zie de temperatuur daarom als een aanwijzing, niet als een vaststaand gegeven.';
  }
  if (/watertype onbekend/i.test(note)) {
    return 'Het watertype is niet vastgelegd. Ik doe daarom geen aanname over stroming.';
  }
  if (/geen concrete lokale habitatkenmerken/i.test(note)) {
    return 'Er zijn nog geen concrete kenmerken van deze stek vastgelegd, zoals diepteverloop, bodem of begroeiing.';
  }
  return null;
}

/**
 * Centrale vertaling van bestaande engine-uitvoer naar een uitvoerbaar visplan.
 * Deze laag berekent zelf geen biologie, kansen, windrelaties of tactiek.
 * Ze ordent bestaande uitkomsten, legt vaktermen uit en maakt onzekerheid expliciet.
 */

/**
 * Korte, brongebonden biologische context voor VisCoach.
 * Deze tekst duidt de kwaliteit en begrenzing van de literatuur; ze berekent
 * geen activiteit, voedingskans, tijdvakvoorkeur of vangstkans.
 */
export function buildVisCoachBiologicalContext(species: FishSpecies | 'Algemeen'): string {
  if (species === 'Algemeen') {
    return 'Er is geen afzonderlijke doelsoort gekozen. Daarom toon ik geen soortspecifieke dagritmevoorkeur; de biologische context blijft algemeen.';
  }
  const feeding = getSpeciesFeedingEvidenceContext(species);
  const diel = getSpeciesDielBehaviorEvidenceContext(species);

  if (diel.feedingRhythm.length > 0) {
    return 'Er zijn studies die het dagritme van voedselopname bij deze soort meten, maar de resultaten zijn gebonden aan specifieke levensfasen, seizoenen, habitats en prooicontexten. Omdat de levensfase en lokale voedselcontext hier niet betrouwbaar bekend zijn, gebruik ik dit als achtergrondinformatie en niet als vaste tijdvakvoorkeur of scorebonus.';
  }

  if (feeding.feedingIntensity.length > 0) {
    return 'Er zijn directe voedingsmetingen bij deze soort, maar in het huidige bronnenregister is geen voldoende onderbouwd dagdeelpatroon beschikbaar. Daarom leid ik hier geen vaste tijdvakvoorkeur uit af.';
  }

  if (
    diel.locomotorActivity.length > 0 ||
    diel.habitatUse.length > 0 ||
    feeding.foragingBehavior.length > 0 ||
    feeding.dietComposition.length > 0 ||
    feeding.preySelection.length > 0
  ) {
    return 'De beschikbare studies beschrijven vooral beweging, habitatgebruik, foerageergedrag of dieet; dat is geen directe meting van tijdgebonden voedselopname. Daarom leid ik hier geen vaste tijdvakvoorkeur uit af.';
  }

  return 'In het huidige bronnenregister ontbreekt directe dagdeelmeting van voedselopname voor deze soort. Er is daarom geen onderbouwde soortspecifieke tijdvakvoorkeur.';
}

export function buildVisCoachAdviceText(
  prognosis: DayPrognosis,
  weather?: import('../types').WeatherSnapshot | null,
  technique?: string | null,
  selectedTimeSlot?: TimeSlot | null
): VisCoachAdviceText {
  const positioning = prognosis.positioningAdvice;
  const habitat = prognosis.habitatAnalysis;
  const wind = prognosis.bankWindAnalysis;
  const thermal = prognosis.thermalAnalysis;
  const adviceSections: string[] = [];
  const tacticSections: string[] = [];

  const selectedSlotAnalysis = selectedTimeSlot ? prognosis.timeSlots?.[selectedTimeSlot] : null;
  const when = selectedTimeSlot
    ? selectedSlotAnalysis?.conclusion
      ? `Je gekozen sessie valt in het tijdvak ${selectedTimeSlot.toLowerCase()}. Voor dit tijdvak geldt: ${selectedSlotAnalysis.conclusion}`
      : `Je gekozen sessie valt in het tijdvak ${selectedTimeSlot.toLowerCase()}. Voor dit tijdvak is geen afzonderlijke analyse beschikbaar; ik leid daarom geen voorkeur af uit het beste tijdvak van de hele dag.`
    : selectedTimeSlot === null
      ? 'Je gekozen sessie bestrijkt meerdere tijdvakken. Daarom wijs ik niet automatisch het beste tijdvak van de hele dag aan; de omstandigheden kunnen binnen je sessie verschillen.'
      : prognosis.bestTimeSlot &&
        prognosis.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag' &&
        prognosis.bestTimeSlot !== 'Geen betekenisvol onderscheid'
          ? `Volgens de prognose is ${prognosis.bestTimeSlot.toLowerCase()} het gunstigste tijdvak. Dat betekent niet dat je op andere momenten geen vis kunt vangen.`
          : 'Er is geen duidelijk beter tijdvak gevonden. Kies je vistijd vooral op basis van je planning en let ter plaatse op activiteit.';

  adviceSections.push(`Wanneer\n${when}`);

  const zoneResolution = resolveCoachStartZone(habitat, positioning);
  const primaryZone = zoneResolution.primaryZone;
  const primaryExplanation = primaryZone
    ? explainZone(primaryZone)
    : 'een plek waar je ter plaatse herkenbare structuur of een verandering in de diepte kunt vinden. De app weet nog niet precies hoe deze stek eruitziet.';
  const thermalLocationNote = thermal?.hasMeasuredWaterTemp || typeof thermal?.estimatedWaterTemp === 'number'
    ? 'De temperatuur geeft vooral activiteitspotentie; zij wijst niet zelfstandig de exacte vislocatie aan.'
    : '';
  const conflictNote = zoneResolution.secondaryZone
    ? zoneResolution.source === 'habitat'
      ? `De wind-/positioneringsanalyse wijst daarnaast op ${explainZone(zoneResolution.secondaryZone)}. Houd dat als tweede zoekzone; gebruik de wind vooral om je presentatie af te stemmen en verlaat de lokale habitatzone niet automatisch.`
      : `De lokale habitatanalyse noemt ${explainZone(zoneResolution.secondaryZone)}, maar die inschatting heeft lage zekerheid. Houd die zone als tweede controlepunt.`
    : '';
  const confidenceNote = zoneResolution.confidenceLevel === 'Laag' && !zoneResolution.hasLocalObservationEvidence
    ? 'De zekerheid is laag; behandel dit als een eerste test en controleer ter plaatse op activiteit en structuur.'
    : '';
  const where = primaryZone
    ? `Begin bij ${primaryExplanation}. ${zoneResolution.explanation} ${conflictNote} ${confidenceNote} ${thermalLocationNote}`.trim()
    : `Begin met het zoeken naar ${primaryExplanation} Kijk vanaf de kant waar je veilig kunt vissen en controleer waar de bodem of oever verandert. Kies geen specifieke diepte of bodemvorm die niet is vastgelegd. ${thermalLocationNote}`.trim();
  adviceSections.push(`Waar beginnen\n${where}`);

  const strongWind = positioning?.windContext?.isStrongWind === true;
  const windIsCalm = positioning?.windContext?.isCalmWind === true;
  const windInfluencesTactics = strongWind || positioning?.windContext?.isCalmWind === false;
  const windIntro = strongWind
    ? 'Er staat volgens de analyse stevige wind.'
    : 'De wind kan de oeverkeuze en werprichting beïnvloeden.';
  const windSpeed = positioning?.windContext?.speedKmH ?? wind?.windSpeedKmH ?? weather?.windSpeed;
  const windDirection = positioning?.windContext?.directionText || weather?.windDirectionText;
  const windOrigin = wind?.windOriginDirection || positioning?.windCastingGuidance?.windOrigin?.fullName || windDirection;
  const windDestination = wind?.windDestinationDirection || positioning?.windCastingGuidance?.windDestination?.fullName;
  const windFlowText = windOrigin
    ? `De wind komt uit de richting ${windOrigin}${windDestination ? ` en waait richting ${windDestination}` : ''}.`
    : '';
  const casting = positioning?.windCastingGuidance?.castingAdvice;
  let windAdvice = '';
  if (strongWind || (windInfluencesTactics && !windIsCalm)) {
    if (casting?.isCastingDirectionDefinite && casting.recommendedDirection) {
      windAdvice = `${windIntro} ${windFlowText} De berekende werprichting is globaal ${casting.recommendedDirection.toLowerCase()}. ${cleanCoachText(casting.reason || casting.summary)}`;
    } else if (wind?.isConfigured && wind.rodPlacementAdvice?.castingDirectionAdvice) {
      windAdvice = `${windIntro} ${windFlowText} ${cleanCoachText(wind.rodPlacementAdvice.primaryPosition)} ${cleanCoachText(wind.rodPlacementAdvice.castingDirectionAdvice)}`;
    } else {
      const directionText = windFlowText || (typeof windSpeed === 'number' ? `De wind is ongeveer ${windSpeed.toFixed(1)} km/u.` : '');
      windAdvice = `${windIntro} ${directionText} De oeverrichting is niet bekend genoeg om een betrouwbare werprichting te bepalen. Kijk ter plaatse waar de wind daadwerkelijk op het water staat; kies niet automatisch de windkant of de luwe kant.`;
    }
  }
  if (windAdvice) tacticSections.push(`Wind en werprichting\n${windAdvice}`);

  const feeding: string[] = [];
  const prebait = prognosis.prebaitPlan;
  if (prebait) {
    const campaignSummary = cleanCoachText(prebait.campaignSummary);
    if (campaignSummary) {
      if (prebait.suitability === 'Niet aanbevolen (instant vissen aanbevolen)') {
        feeding.push(/^niet voorvoeren/i.test(campaignSummary)
          ? campaignSummary
          : `Voorvoeren niet aanbevolen: ${campaignSummary}`);
      } else if (prebait.shouldPrebait) {
        feeding.push(`Voorvoeren: ${campaignSummary}`);
      } else {
        feeding.push(`Er is voor deze starttijd geen voorvoerbeurt ingepland. ${campaignSummary}`);
      }
    }
    const campaignSchedule = prebait.moments
      .filter((moment) => moment.dayOffset < 0)
      .map((moment) => `${moment.dayLabel}: ${moment.amountDisplay}`)
      .join('; ');
    if (prebait.shouldPrebait && prebait.confidenceLevel === 'Redelijk' && campaignSchedule) {
      feeding.push(`Indicatief voorvoerschema: ${campaignSchedule}. Start terughoudend en verhoog alleen bij duidelijke activiteit.`);
    }

    const sessionFeeding = cleanCoachText(prebait.sessionDayGuidance.advice);
    if (sessionFeeding) {
      const amountGuidance = prebait.confidenceLevel === 'Redelijk' &&
        prebait.sessionDayGuidance.feedDuringSession &&
        prebait.sessionDayGuidance.recommendedAmountGrams > 0
        ? ` Indicatieve hoeveelheid tijdens de sessie: ${prebait.sessionDayGuidance.amountDisplay}; pas aan op activiteit, bodem en natuurlijk voedsel.`
        : '';
      feeding.push(`Tijdens de sessie: ${sessionFeeding}${amountGuidance}`);
    }

    const recommendedMix = cleanCoachText(prebait.feedCompositionAdvice.recommendedMix);
    if (recommendedMix && prebait.confidenceLevel !== 'Laag') {
      feeding.push(`Voersamenstelling: ${recommendedMix}.`);
    }
    if (prebait.personalEvidence?.hasSufficientData) {
      const personalNote = cleanCoachText(prebait.personalEvidence.summaryNote);
      if (personalNote) feeding.push(`Eigen sessiehistorie: ${personalNote}`);
    }
    if (prebait.confidenceLevel !== 'Redelijk' && prebait.sessionDayGuidance.recommendedAmountGrams > 0) {
      feeding.push('De exacte hoeveelheid is nog onzeker; begin terughoudend en pas aan op activiteit, bodem en natuurlijk voedsel.');
    }
    if (technique?.toLowerCase().includes('method') && prebait.methodFeederGuidance) {
      feeding.push(cleanCoachText(prebait.methodFeederGuidance));
    }
  }
  if (feeding.length > 0) tacticSections.push(`Voeren en aas\n${feeding.join(' ')}`);

  const alternative = zoneResolution.secondaryZone
    ? `Vergelijk daarna ${explainZone(zoneResolution.secondaryZone)}.`
    : positioning?.alternativeOption && !isGenericZone(positioning.alternativeOption)
      ? cleanCoachText(positioning.alternativeOption)
      : habitat?.alternativeZone?.name && !isGenericZone(habitat.alternativeZone.name)
        ? `Probeer daarna ${explainZone(habitat.alternativeZone.name)}.`
        : '';
  const fallback = alternative
    ? `Als je op de eerste plek geen activiteit ziet of geen aanbeten krijgt, probeer dan deze tweede optie: ${alternative}`
    : 'Zie je geen activiteit of krijg je geen aanbeten, controleer dan eerst opnieuw de omgeving en probeer een tweede herkenbare structuur of diepteovergang. Verander niet steeds van aanpak door kleine weersschommelingen.';
  tacticSections.push(`Als het niet werkt\n${fallback}`);

  const summary = `De verwachting voor ${prognosis.species.toLowerCase()} is ${prognosis.advice.toLowerCase()}.`;
  const reasons: string[] = [];
  const summaryRationale = cleanCoachText(prognosis.summaryRationale);
  if (summaryRationale && !/aanvullende locatiegegevens|onbekend/i.test(summaryRationale)) {
    reasons.push(summaryRationale);
  }
  if (thermal) {
    if (thermal.hasMeasuredWaterTemp && typeof thermal.measuredWaterTemp === 'number') {
      reasons.push(`De watertemperatuur is gemeten op ${thermal.measuredWaterTemp.toFixed(1)} °C.`);
    } else if (typeof thermal.estimatedWaterTemp === 'number') {
      reasons.push(`De watertemperatuur is geschat op ongeveer ${thermal.estimatedWaterTemp.toFixed(1)} °C en niet op deze stek gemeten. De invloed van temperatuur is daarom onzeker.`);
    }
  }
  const explanation = cleanCoachText(zoneResolution.explanation);
  if (explanation && !/aanvullende locatiegegevens|onbekend/i.test(explanation)) reasons.push(explanation);
  if (zoneResolution.hasConflict) {
    const secondaryReason = zoneResolution.source === 'habitat'
      ? cleanCoachText(positioning?.rationale)
      : cleanCoachText(habitat?.primaryZone?.whyLikely);
    if (secondaryReason && !/aanvullende locatiegegevens|onbekend/i.test(secondaryReason)) reasons.push(secondaryReason);
  }
  if (windInfluencesTactics && wind?.isConfigured && wind.bankAssessment?.explanation) {
    reasons.push(cleanCoachText(wind.bankAssessment.explanation));
  }
  const limitations = (prognosis.uncertaintyNotes ?? [])
    .map(explainCoachLimitation)
    .filter((item): item is string => Boolean(item));
  const uniqueReasons = [...new Set([...reasons, ...limitations])].slice(0, 4);

  return {
    summary,
    advice: adviceSections.join('\n\n'),
    tactics: tacticSections.join('\n\n'),
    recommendation: [adviceSections.join('\n\n'), tacticSections.join('\n\n')].filter(Boolean).join('\n\n'),
    rationale: uniqueReasons.join(' '),
  };
}

function createAdviceRecord(
  session: FishingSession,
  snapshot: PrognosisSnapshot,
  prognosis: DayPrognosis,
  previousAdvice?: CoachAdviceRecord,
  trigger: CoachAdviceTrigger = 'weather_update',
  changedFactors: string[] = []
): CoachAdviceRecord {
  const sessionStart = new Date(session.startTime);
  const sessionEnd = session.endTime ? new Date(session.endTime) : null;
  const selectedTimeSlot = Number.isFinite(sessionStart.getTime()) && (!sessionEnd || Number.isFinite(sessionEnd.getTime()))
    ? resolveSelectedTimeSlot(sessionStart, sessionEnd) ?? null
    : null;
  const text = buildVisCoachAdviceText(prognosis, snapshot.predictedConditions, snapshot.technique ?? session.technique, selectedTimeSlot);
  return {
    id: `coach-advice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: session.id,
    prognosisSnapshotId: snapshot.id,
    previousAdviceId: previousAdvice?.id,
    createdAt: new Date().toISOString(),
    trigger,
    summary: text.summary,
    advice: text.advice,
    tactics: text.tactics,
    recommendation: text.recommendation,
    rationale: text.rationale,
    changedFactors,
    confidence: prognosis.personalCatchConfidence,
    response: 'pending',
    coachVersion: 'viscoach-session-coordinator-v1',
    engineVersions: snapshot.engineVersions ? { ...snapshot.engineVersions } : { prognosis: snapshot.modelVersion },
  };
}

/** 
 * Houd de vergelijkingsbasis vast op het snapshot waarop het laatst getoonde
 * advies rust. Tussentijdse berekeningen mogen die referentie niet opschuiven.
 */
export function getAdviceBaselineSnapshot(
  snapshots: PrognosisSnapshot[],
  previousAdvice: CoachAdviceRecord | undefined,
  fallbackSnapshot: PrognosisSnapshot | undefined
): PrognosisSnapshot | undefined {
  if (previousAdvice) {
    const advisedSnapshot = snapshots.find((snapshot) => snapshot.id === previousAdvice.prognosisSnapshotId);
    if (advisedSnapshot) return advisedSnapshot;
  }
  return fallbackSnapshot;
}

export const VISCOACH_UPDATED_EVENT = 'vislogboek:viscoach-updated';

function notifyVisCoachUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VISCOACH_UPDATED_EVENT));
  }
}

/**
 * Slaat alleen expliciete gebruikersfeedback op het bestaande adviesrecord op.
 * De prognose en het oorspronkelijke advies blijven onveranderd.
 */
export async function updateCoachAdviceFeedback(
  adviceId: string,
  updates: { response?: CoachAdviceResponse; executedTactic?: string }
): Promise<CoachAdviceRecord | null> {
  const existing = await db.coachAdviceRecords.get(adviceId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const patch: Partial<CoachAdviceRecord> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'response')) {
    patch.response = updates.response;
    patch.responseAt = updates.response ? now : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'executedTactic')) {
    const tactic = updates.executedTactic?.trim() ?? '';
    patch.executedTactic = tactic || undefined;
    patch.executedAt = tactic ? now : undefined;
  }
  if (Object.keys(patch).length === 0) return existing;

  await db.coachAdviceRecords.update(adviceId, patch);
  const updated = await db.coachAdviceRecords.get(adviceId);
  if (updated) notifyVisCoachUpdated();
  return updated ?? null;
}

/** Bewaart het eerste coachadvies op basis van de volledige startsnapshot. */
export async function createInitialCoachAdviceRecord(
  session: FishingSession,
  snapshot: PrognosisSnapshot
): Promise<CoachAdviceRecord | null> {
  if (!snapshot.prognosisData || snapshot.linkedSessionId !== session.id) return null;
  const advice = await db.transaction('rw', db.coachAdviceRecords, async () => {
    const existing = await db.coachAdviceRecords.where('sessionId').equals(session.id).first();
    if (existing) return existing;
    const created = createAdviceRecord(session, snapshot, snapshot.prognosisData!, undefined, 'session_start', []);
    await db.coachAdviceRecords.put(created);
    return created;
  });
  notifyVisCoachUpdated();
  return advice;
}

/**
 * Slaat een betekenisvolle tussentijdse snapshot en het bijbehorende advies atomair op.
 * De database wordt binnen dezelfde read/write-transactie opnieuw gecontroleerd op
 * identieke invoer en een gewijzigd adviesbaseline (ook bij meerdere app-tabs).
 */
export async function persistCoachReassessment(
  input: PersistCoachReassessmentInput
): Promise<PersistCoachReassessmentResult> {
  const {
    session, prognosis, currentSignature, inputFingerprint, location,
    durationHours, weatherInput, inputContext, previousSnapshot, previousAdvice, trigger,
  } = input;

  return db.transaction('rw', db.prognosisSnapshots, db.coachAdviceRecords, async () => {
    const currentSnapshots = await db.prognosisSnapshots.where('linkedSessionId').equals(session.id).toArray();
    if (currentSnapshots.some((item) => item.inputFingerprint === inputFingerprint)) {
      return { status: 'duplicate' };
    }

    const currentAdvice = (await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const currentAdviceSnapshot = currentAdvice
      ? currentSnapshots.find((item) => item.id === currentAdvice.prognosisSnapshotId)
      : undefined;
    const currentBaseline = currentAdviceSnapshot ?? previousSnapshot;
    if (!currentBaseline?.prognosisData) return { status: 'missing_baseline' };

    const transactionChangedFactors = changedSignatureFactors(
      prognosisSignature(currentBaseline.prognosisData),
      currentSignature
    );
    if (transactionChangedFactors.length === 0) return { status: 'unchanged' };

    const savedSnapshot = await savePrognosisSnapshot(
      prognosis,
      durationHours ?? 0,
      location.id,
      location.name,
      session.technique,
      inputContext.targetTimeSlot ?? (
        prognosis.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag' || prognosis.bestTimeSlot === 'Geen betekenisvol onderscheid'
          ? undefined
          : prognosis.bestTimeSlot
      ),
      session.weatherSnapshot,
      {
        runKind: 'session_update',
        weatherInput,
        inputContext,
        inputFingerprint,
        supersedesSnapshotId: currentBaseline.id,
      }
    );
    await db.prognosisSnapshots.update(savedSnapshot.id, { linkedSessionId: session.id });
    const linkedSnapshot: PrognosisSnapshot = { ...savedSnapshot, linkedSessionId: session.id };

    const savedAdvice = createAdviceRecord(
      session,
      linkedSnapshot,
      prognosis,
      currentAdvice ?? previousAdvice,
      trigger,
      transactionChangedFactors
    );
    await db.coachAdviceRecords.put(savedAdvice);
    return { status: 'created', snapshot: linkedSnapshot, advice: savedAdvice };
  });
}

/**
 * Herbeoordeelt actieve sessies met de bestaande weerbron en prognose-engine.
 * Deze service berekent zelf geen biologische score of tactische regels.
 */
export async function reassessActiveSessions(
  trigger: CoachAdviceTrigger = 'weather_update',
  sessionId?: string
): Promise<SessionCoachReassessmentResult[]> {
  const [sessions, locations, catches, snapshots, observations] = await Promise.all([
    db.sessions.toArray(),
    db.locations.toArray(),
    db.catches.toArray(),
    db.prognosisSnapshots.toArray(),
    db.presenceObservations.toArray(),
  ]);

  const activeSessions = sessions.filter((session) => session.outcome === 'active' && (!sessionId || session.id === sessionId));
  if (activeSessions.length === 0) return [];

  const locationById = new Map(locations.map((location) => [location.id, location]));
  const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(sessions, snapshots, locations);
  const results: SessionCoachReassessmentResult[] = [];

  for (const session of activeSessions) {
    if (sessionsBeingReassessed.has(session.id)) {
      results.push({ sessionId: session.id, status: 'skipped', reason: 'Deze sessie wordt al herbeoordeeld.' });
      continue;
    }
    sessionsBeingReassessed.add(session.id);
    const location = session.locationId ? locationById.get(session.locationId) : undefined;
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      results.push({ sessionId: session.id, status: 'skipped', reason: 'Stek heeft geen bruikbare GPS-coördinaten.' });
      sessionsBeingReassessed.delete(session.id);
      continue;
    }

    try {
      const weather = await getForecast(location.latitude, location.longitude, false);
      if (!weather.hourly?.length) {
        results.push({ sessionId: session.id, status: 'skipped', reason: 'Geen actuele of gecachete weersverwachting beschikbaar.' });
        continue;
      }

      const now = new Date();
      const targetTimeSlot = resolveSelectedTimeSlot(now, null);
      const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(now);
      const species = session.targetSpecies?.[0] ?? 'Algemeen';
      const durationHours = getSessionDurationHours(session);
      const sessionObservations = observations.filter((item) => item.sessionId === session.id);
      const latestObservation = sessionObservations
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const waterTemperatureCalibration = getWaterTemperatureCalibration(snapshots, location.id, date);
      const prognosis = calculateDayPrognosis(
        date,
        weather.hourly,
        species,
        sessions,
        weather.fetchedAt,
        null, // Sessiemeting is een historisch anker; nooit opnieuw als actuele meting behandelen.
        now,
        {
          sessionDurationHours: durationHours ?? undefined,
          allowUnknownSessionDuration: true,
          targetTimeSlot,
          locationId: location.id,
          location,
          catches,
          observations: sessionObservations,
          presenceObservation: latestObservation?.observationType ?? 'onbekend',
          historicalWaterTemperatures,
          waterTemperatureCalibration,
        }
      );

      const historyFeatures = createPrognosisHistoryFeatureSnapshot(sessions, catches, sessionObservations);
      const inputFingerprint = createPrognosisInputFingerprint({
        date,
        species,
        locationId: location.id,
        durationHours,
        startTime: session.startTime,
        targetTimeSlot: targetTimeSlot ?? null,
        technique: session.technique ?? null,
        waterTemperature: session.waterTemperature ?? null,
        locationContext: [location.waterType, location.waterDepth, location.waterFacingDirection, location.habitatFeatures],
        weather: weather.hourly,
        historyFeatures,
        historicalWaterTemperatures,
        waterTemperatureCalibration,
      });

      if (lastEvaluatedFingerprint.get(session.id) === inputFingerprint) {
        results.push({ sessionId: session.id, status: 'unchanged', reason: 'Dezelfde invoer is al beoordeeld.' });
        continue;
      }

      const linkedSnapshots = snapshots
        .filter((snapshot) => snapshot.linkedSessionId === session.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const previousAdvice = (await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const initialSnapshot = linkedSnapshots.find((snapshot) => snapshot.runKind === 'session_start') ??
        snapshots.find((snapshot) => snapshot.id === session.snapshotId);
      const previousSnapshot = getAdviceBaselineSnapshot(snapshots, previousAdvice, initialSnapshot);
      if (!previousSnapshot) {
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        results.push({ sessionId: session.id, status: 'skipped', reason: 'Geen oorspronkelijke sessieprognose om mee te vergelijken.' });
        continue;
      }

      if (!previousSnapshot.prognosisData) {
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        results.push({
          sessionId: session.id,
          status: 'skipped',
          reason: 'De oorspronkelijke snapshot bevat nog geen volledige prognose-uitvoer; een betrouwbare vergelijking is niet mogelijk.',
        });
        continue;
      }
      const previousSignature = prognosisSignature(previousSnapshot.prognosisData);
      const currentSignature = prognosisSignature(prognosis);
      const changedFactors = changedSignatureFactors(previousSignature, currentSignature);

      if (changedFactors.length === 0) {
        pendingWeatherChanges.delete(session.id);
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        results.push({ sessionId: session.id, status: 'unchanged', reason: 'Geen betekenisvolle verandering in prognose of praktische analyse.' });
        continue;
      }

      // Automatische forecast-refreshes en hervatten na heropenen krijgen hysterese.
      // Handmatige controle en expliciete gebruikers-/sessiewijzigingen worden direct
      // met de meest recente beschikbare data beoordeeld.
      if (requiresWeatherConfirmation(trigger)) {
        // App hervatten mag een bestaande kandidaat niet bevestigen of verhogen.
        // Bewaar de kandidaat ongewijzigd; alleen een nieuwe forecast-refresh telt.
        if (!countsAsWeatherConfirmation(trigger)) {
          lastEvaluatedFingerprint.set(session.id, inputFingerprint);
          results.push({
            sessionId: session.id,
            status: 'unchanged',
            reason: 'App hervat: prognose opnieuw beoordeeld, maar deze herbeoordeling telt niet als weersbevestiging. Wacht op een nieuwe weersupdate.',
          });
          continue;
        }

        const confirmation = nextWeatherChangeConfirmation(
          pendingWeatherChanges.get(session.id),
          currentSignature
        );
        pendingWeatherChanges.set(session.id, confirmation);
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        if (confirmation.confirmations < 2) {
          results.push({
            sessionId: session.id,
            status: 'unchanged',
            reason: 'Mogelijke wijziging wordt bij een volgende afwijkende weersupdate bevestigd om onnodig wisselend advies te voorkomen.',
          });
          continue;
        }
      }
      pendingWeatherChanges.delete(session.id);

      const inputContext: PrognosisInputContext = {
        calculatedAt: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
        targetDate: date,
        targetTimeSlot: targetTimeSlot ?? null,
        targetSpecies: species,
        sessionDurationHours: durationHours,
        technique: session.technique ?? null,
        manualWaterTemperatureInput: null, // De sessiemeting is al als historisch anker opgenomen; geen actuele handmatige invoer.
        waterTemperatureCalibration,
        location: {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          waterType: location.waterType,
          waterDepth: location.waterDepth,
          waterFacingDirection: location.waterFacingDirection,
          habitatFeatures: location.habitatFeatures,
        },
        historicalSessionIds: historyFeatures.historicalSessionFeatures!.map((item) => item.id),
        catchRecordIds: historyFeatures.historicalCatchFeatures!.map((item) => item.id),
        observationIds: historyFeatures.historicalObservationFeatures!.map((item) => item.id),
        ...historyFeatures,
        presenceObservation: latestObservation?.observationType ?? 'onbekend',
        historicalWaterTemperatureSamples: historicalWaterTemperatures,
        historyFingerprint: createPrognosisHistoryFingerprint(sessions, catches, sessionObservations, historicalWaterTemperatures),
        historySummary: {
          sessionCount: historyFeatures.historicalSessionFeatures!.length,
          catchRecordCount: historyFeatures.historicalCatchFeatures!.length,
          observationCount: historyFeatures.historicalObservationFeatures!.length,
          historicalWaterTemperatureSampleCount: historicalWaterTemperatures.length,
        },
        weatherFetchedAt: weather.fetchedAt,
      };

      const persistence = await persistCoachReassessment({
        session,
        prognosis,
        currentSignature,
        inputFingerprint,
        location,
        durationHours,
        weatherInput: weather.hourly,
        inputContext,
        previousSnapshot,
        previousAdvice,
        trigger,
      });

      lastEvaluatedFingerprint.set(session.id, inputFingerprint);
      if (persistence.status !== 'created') {
        results.push({
          sessionId: session.id,
          status: 'unchanged',
          reason: persistence.status === 'duplicate'
            ? 'Deze invoer is al in een andere herbeoordeling opgeslagen.'
            : persistence.status === 'missing_baseline'
              ? 'De oorspronkelijke prognose ontbreekt; er is geen veilige vergelijkingsbasis.'
              : 'De praktische uitkomst is inmiddels gelijk aan het laatst vastgelegde advies.',
        });
        continue;
      }

      notifyVisCoachUpdated();
      results.push({
        sessionId: session.id,
        status: 'snapshot_created',
        snapshotId: persistence.snapshot.id,
        adviceId: persistence.advice.id,
        reason: 'De praktische prognose-uitkomst is betekenisvol gewijzigd; snapshot en coachadvies zijn atomair opgeslagen.',
      });
    } catch (error) {
      results.push({
        sessionId: session.id,
        status: 'skipped',
        reason: error instanceof Error ? error.message : 'Onbekende fout bij herbeoordeling.',
      });
    } finally {
      sessionsBeingReassessed.delete(session.id);
    }
  }

  return results;
}
