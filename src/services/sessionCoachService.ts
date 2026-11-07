import { db } from '../db/db';
import {
  CoachAdviceRecord,
  CoachAdviceResponse,
  CoachAdviceTrigger,
  DayPrognosis,
  FishingLocation,
  FishingSession,
  PrognosisSnapshot,
  PrognosisInputContext,
} from '../types';
import { calculateDayPrognosis, createPrognosisInputFingerprint, getSessionDurationHours, savePrognosisSnapshot } from './prognosisEngine';
import { getForecast } from './weatherService';
import { getWaterTemperatureCalibration } from './evaluationEngine';
import { collectHistoricalWaterTemperatureObservations } from './waterTemperatureHistory';

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
 * Autonome forecast-refreshes en hervatten na app-heropenen vereisen een tweede
 * afwijkende weersinvoer met dezelfde praktische uitkomst. Een hervatting is
 * dus wel een herbeoordeling, maar op zichzelf geen bevestiging van een kandidaat.
 */
export function requiresWeatherConfirmation(trigger: CoachAdviceTrigger): boolean {
  return trigger === 'weather_update' || trigger === 'app_resume';
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
  recommendation: string;
  rationale: string;
}

function cleanCoachText(value: string | undefined): string {
  return (value ?? '').replaceAll('\\n', ' ').replaceAll('\\r', ' ').replaceAll('\\t', ' ').trim();
}

function isGenericZone(value: string): boolean {
  return /algemene zoekzone|bekende lokale structuurzone|aanvullende locatiegegevens|onbekend/i.test(value);
}

function explainZone(value: string): string {
  const normalized = value.toLowerCase();
  if (/overgang/.test(normalized)) return 'de overgang waar ondieper water overgaat in dieper water';
  if (/diep|rustzone|holding/.test(normalized)) return 'een dieper en rustiger deel van het water';
  if (/riet/.test(normalized)) return 'de rietkraag, als die op deze stek aanwezig is';
  if (/structuur/.test(normalized)) return 'een plek waar je ter plaatse duidelijke structuur ziet, bijvoorbeeld begroeiing of een verandering in de bodem';
  return value;
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
export function buildVisCoachAdviceText(
  prognosis: DayPrognosis,
  weather?: import('../types').WeatherSnapshot | null,
  technique?: string | null
): VisCoachAdviceText {
  const positioning = prognosis.positioningAdvice;
  const habitat = prognosis.habitatAnalysis;
  const wind = prognosis.bankWindAnalysis;
  const thermal = prognosis.thermalAnalysis;
  const sections: string[] = [];

  const when = prognosis.bestTimeSlot &&
    prognosis.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag' &&
    prognosis.bestTimeSlot !== 'Geen betekenisvol onderscheid'
      ? `Volgens de prognose is ${prognosis.bestTimeSlot.toLowerCase()} het gunstigste tijdvak. Dat betekent niet dat je op andere momenten geen vis kunt vangen.`
      : 'Er is geen duidelijk beter tijdvak gevonden. Kies je vistijd vooral op basis van je planning en let ter plaatse op activiteit.';

  sections.push(`Wanneer\n${when}`);

  const primaryZone = habitat?.primaryZone?.name && !isGenericZone(habitat.primaryZone.name)
    ? habitat.primaryZone.name
    : positioning?.recommendedZone && !isGenericZone(positioning.recommendedZone)
      ? positioning.recommendedZone
      : null;
  const primaryExplanation = primaryZone
    ? explainZone(primaryZone)
    : 'een plek waar je ter plaatse herkenbare structuur of een verandering in de diepte kunt vinden. De app weet nog niet precies hoe deze stek eruitziet.';
  const where = primaryZone
    ? `Begin bij ${primaryExplanation}. Dit is de belangrijkste zoekzone die uit de beschikbare stekgegevens en analyses naar voren komt.`
    : `Begin met het zoeken naar ${primaryExplanation} Kijk vanaf de kant waar je veilig kunt vissen en controleer waar de bodem of oever verandert. Kies geen specifieke diepte of bodemvorm die niet is vastgelegd.`;
  sections.push(`Waar beginnen\n${where}`);

  const strongWind = positioning?.windContext?.isStrongWind === true;
  const windSpeed = positioning?.windContext?.speedKmH ?? wind?.windSpeedKmH ?? weather?.windSpeed;
  const windDirection = positioning?.windContext?.directionText || weather?.windDirectionText;
  const casting = positioning?.windCastingGuidance?.castingAdvice;
  let windAdvice = '';
  if (strongWind) {
    if (casting?.isCastingDirectionDefinite && casting.recommendedDirection) {
      windAdvice = `Er staat volgens de analyse stevige wind. De berekende werprichting is globaal ${casting.recommendedDirection.toLowerCase()}. ${cleanCoachText(casting.reason || casting.summary)}`;
    } else if (wind?.isConfigured && wind.rodPlacementAdvice?.castingDirectionAdvice) {
      windAdvice = `Er staat volgens de analyse stevige wind. ${cleanCoachText(wind.rodPlacementAdvice.primaryPosition)} ${cleanCoachText(wind.rodPlacementAdvice.castingDirectionAdvice)}`;
    } else {
      const directionText = windDirection
        ? `De wind komt uit het ${windDirection.toLowerCase()}${typeof windSpeed === 'number' ? ` met ongeveer ${windSpeed.toFixed(1)} km/u` : ''}.`
        : typeof windSpeed === 'number' ? `De wind is ongeveer ${windSpeed.toFixed(1)} km/u.` : '';
      windAdvice = `${directionText} De oeverrichting is niet bekend genoeg om een betrouwbare werprichting te bepalen. Kijk ter plaatse waar de wind daadwerkelijk op het water staat; kies niet automatisch de windkant of de luwe kant.`;
    }
  }
  if (windAdvice) sections.push(`Wind en werprichting\n${windAdvice}`);

  const feeding: string[] = [];
  const sessionFeeding = cleanCoachText(prognosis.prebaitPlan?.sessionDayGuidance?.advice);
  if (sessionFeeding) feeding.push(sessionFeeding);
  if (prognosis.prebaitPlan?.methodFeederGuidance) {
    feeding.push(technique?.toLowerCase().includes('method')
      ? 'Bij method feeder zit het voer in of rond het voerkorfje, vlak bij je haakaas. Houd die korfvulling apart van eventueel vooraf gevoerd aas.'
      : 'De voeranalyse bevat ook een aanwijzing voor method feeder. Die is alleen van toepassing als je daadwerkelijk met deze techniek vist.');
  }
  if (feeding.length > 0) sections.push(`Voeren en aas\n${feeding.join(' ')}`);

  const alternative = positioning?.alternativeOption
    ? cleanCoachText(positioning.alternativeOption)
    : habitat?.alternativeZone?.name && !isGenericZone(habitat.alternativeZone.name)
      ? `Probeer daarna ${explainZone(habitat.alternativeZone.name)}.`
      : '';
  const fallback = alternative
    ? `Als je op de eerste plek geen activiteit ziet of geen aanbeten krijgt, probeer dan deze tweede optie: ${alternative}`
    : 'Zie je geen activiteit of krijg je geen aanbeten, controleer dan eerst opnieuw de omgeving en probeer een tweede herkenbare structuur of diepteovergang. Verander niet steeds van aanpak door kleine weersschommelingen.';
  sections.push(`Als het niet werkt\n${fallback}`);

  const summary = `De verwachting voor ${prognosis.species.toLowerCase()} is ${prognosis.advice.toLowerCase()}.`;
  const reasons: string[] = [];
  if (thermal) {
    if (thermal.hasMeasuredWaterTemp && typeof thermal.measuredWaterTemp === 'number') {
      reasons.push(`De watertemperatuur is gemeten op ${thermal.measuredWaterTemp.toFixed(1)} °C.`);
    } else if (typeof thermal.estimatedWaterTemp === 'number') {
      reasons.push(`De watertemperatuur is geschat op ongeveer ${thermal.estimatedWaterTemp.toFixed(1)} °C en niet op deze stek gemeten. De invloed van temperatuur is daarom onzeker.`);
    }
  }
  const explanation = cleanCoachText(habitat?.primaryZone?.whyLikely || positioning?.rationale);
  if (explanation && !/aanvullende locatiegegevens|onbekend/i.test(explanation)) reasons.push(explanation);
  if (strongWind && wind?.isConfigured && wind.bankAssessment?.explanation) {
    reasons.push(cleanCoachText(wind.bankAssessment.explanation));
  }
  const limitations = (prognosis.uncertaintyNotes ?? [])
    .map(explainCoachLimitation)
    .filter((item): item is string => Boolean(item));
  const uniqueReasons = [...new Set([...reasons, ...limitations])].slice(0, 4);

  return {
    summary,
    recommendation: sections.join('\n\n'),
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
  const text = buildVisCoachAdviceText(prognosis, snapshot.predictedConditions, snapshot.technique ?? session.technique);
  return {
    id: `coach-advice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: session.id,
    prognosisSnapshotId: snapshot.id,
    previousAdviceId: previousAdvice?.id,
    createdAt: new Date().toISOString(),
    trigger,
    summary: text.summary,
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
      prognosis.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag' || prognosis.bestTimeSlot === 'Geen betekenisvol onderscheid'
        ? undefined
        : prognosis.bestTimeSlot,
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
        session.waterTemperature ?? null,
        now,
        {
          sessionDurationHours: durationHours ?? undefined,
          allowUnknownSessionDuration: true,
          locationId: location.id,
          location,
          catches,
          observations: sessionObservations,
          presenceObservation: latestObservation?.observationType ?? 'onbekend',
          historicalWaterTemperatures,
          waterTemperatureCalibration,
        }
      );

      const inputFingerprint = createPrognosisInputFingerprint({
        date,
        species,
        locationId: location.id,
        durationHours,
        startTime: session.startTime,
        technique: session.technique ?? null,
        waterTemperature: session.waterTemperature ?? null,
        locationContext: [location.waterType, location.waterDepth, location.waterFacingDirection, location.habitatFeatures],
        weather: weather.hourly,
        sessions: sessions.map((item) => [item.id, item.startTime, item.updatedAt, item.outcome, item.targetSpecies, item.durationMinutes, item.waterTemperature]),
        catches: catches.map((item) => [item.id, item.sessionId, item.timestamp, item.species, item.count]),
        observations: sessionObservations.map((item) => [item.id, item.timestamp, item.observationType]),
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
        targetSpecies: species,
        sessionDurationHours: durationHours,
        technique: session.technique ?? null,
        location: {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          waterType: location.waterType,
          waterDepth: location.waterDepth,
          waterFacingDirection: location.waterFacingDirection,
          habitatFeatures: location.habitatFeatures,
        },
        historicalSessionIds: sessions.filter((item) => item.isBenchmark !== true).map((item) => item.id),
        catchRecordIds: catches.map((item) => item.id),
        observationIds: sessionObservations.map((item) => item.id),
        presenceObservation: latestObservation?.observationType ?? 'onbekend',
        historicalWaterTemperatureSamples: historicalWaterTemperatures,
        historyFingerprint: createPrognosisInputFingerprint({
          sessions: sessions.map((item) => [item.id, item.updatedAt, item.startTime, item.endTime, item.durationMinutes, item.plannedDurationHours, item.targetSpecies, item.outcome, item.waterTemperature, item.technique]),
          catches: catches.map((item) => [item.id, item.sessionId, item.timestamp, item.species, item.count, item.weightKg, item.lengthCm, item.bait, item.technique]),
          observations: sessionObservations.map((item) => [item.id, item.timestamp, item.observationType]),
          historicalWaterTemperatures,
        }),
        historySummary: {
          sessionCount: sessions.filter((item) => item.isBenchmark !== true).length,
          catchRecordCount: catches.length,
          observationCount: sessionObservations.length,
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
