import type { FishSpecies, FeedingActivityAssessment, FeedingEvidenceLevel, FeedingResponseEvidenceSummary, TimeSlot } from '../types';
import { SPECIES_PROFILES } from './fishProfiles';
import type { CivilTwilightTimes } from './solarTimeEngine';
import { getSpeciesFeedingEvidenceContext } from './feedingEvidenceService';
import type { ResearchRegistryEntry } from './researchRegistry';

export interface FeedingResponseScore {
  score: number;
  dielScore: number;
  seasonalScore: number;
  confidencePercent: number;
  confidenceLevel: 'Laag' | 'Matig' | 'Redelijk' | 'Hoog';
  usedDrivers: string[];
  missingDrivers: string[];
  explanation: string;
}

const SLOT_MINUTES: Record<TimeSlot, [number, number]> = {
  Nacht: [0, 360], Ochtend: [360, 720], Middag: [720, 1080], Avond: [1080, 1440],
};

function clockMinutes(value: string): number | null {
  const match = /^(\\d{2}):(\\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

function calculateDielScore(species: FishSpecies, slot: TimeSlot, solarTimes?: CivilTwilightTimes | null): number | null {
  const diel = SPECIES_PROFILES[species].dielFeedingScores;
  if (!diel) return null;
  const [slotStart, slotEnd] = SLOT_MINUTES[slot];
  const dawn = solarTimes ? clockMinutes(solarTimes.civilDawn) : null;
  const sunrise = solarTimes ? clockMinutes(solarTimes.sunrise) : null;
  const sunset = solarTimes ? clockMinutes(solarTimes.sunset) : null;
  const dusk = solarTimes ? clockMinutes(solarTimes.civilDusk) : null;
  if (dawn === null || sunrise === null || sunset === null || dusk === null || !(dawn <= sunrise && sunrise < sunset && sunset <= dusk)) {
    return ({ Nacht: diel.night, Ochtend: (diel.dawn + diel.day) / 2, Middag: diel.day, Avond: (diel.dusk + diel.night) / 2 })[slot];
  }
  const phases = [
    { start: 0, end: dawn, value: diel.night },
    { start: dawn, end: sunrise, value: diel.dawn },
    { start: sunrise, end: sunset, value: diel.day },
    { start: sunset, end: dusk, value: diel.dusk },
    { start: dusk, end: 1440, value: diel.night },
  ];
  return phases.reduce((sum, phase) => sum + Math.max(0, Math.min(slotEnd, phase.end) - Math.max(slotStart, phase.start)) * phase.value, 0) / (slotEnd - slotStart);
}

/** Operationele v1: soortspecifiek dagritme + seizoensfase; ontbrekende voedsel- en waterdrivers verlagen dekking, niet de score via een fictieve nul. */
export function calculateSpeciesFeedingResponse(species: FishSpecies, month: number, slot: TimeSlot, solarTimes?: CivilTwilightTimes | null): FeedingResponseScore | null {
  if (species === 'Overig') return null;
  const profile = SPECIES_PROFILES[species], weights = profile.feedingDriverWeights;
  const dielScore = calculateDielScore(species, slot, solarTimes);
  const seasonalValue = profile.seasonalFeedingScores?.[month - 1];
  const seasonalScore = Number.isFinite(seasonalValue) ? (seasonalValue as number) / 100 : null;
  if (!weights || dielScore === null || seasonalScore === null) return null;
  const activeWeight = weights.diel + weights.seasonalPhase;
  if (activeWeight <= 0) return null;
  const normalized = (dielScore * weights.diel + seasonalScore * weights.seasonalPhase) / activeWeight;
  const confidencePercent = Math.round(activeWeight * 100);
  const score = Math.round((1 + 9 * Math.max(0, Math.min(1, normalized))) * 10) / 10;
  const missingDrivers = [
    ...(weights.foodAvailability > 0 ? ['Voedsel-/prooiaanbod (geen actuele invoer)'] : []),
    ...(weights.waterActivity > 0 ? ['Stroming/wateractiviteit (geen actuele invoer)'] : []),
  ];
  const usedDrivers = [
    `Dagritme/licht (${Math.round(dielScore * 100)}/100; gewicht ${Math.round(weights.diel * 100)}%)`,
    `Seizoensfase (${Math.round(seasonalScore * 100)}/100; gewicht ${Math.round(weights.seasonalPhase * 100)}%)`,
  ];
  return {
    score, dielScore, seasonalScore, confidencePercent,
    confidenceLevel: confidencePercent >= 75 ? 'Redelijk' : confidencePercent >= 50 ? 'Matig' : 'Laag',
    usedDrivers, missingDrivers,
    explanation: `Voorlopige voedings-/foerageerrespons ${score.toFixed(1)}/10 uit soortspecifiek dagritme en seizoensfase. Bekend gewicht: ${confidencePercent}%; voedsel-/prooiaanbod en wateractiviteit ontbreken en zijn niet als neutraal ingevuld. Resterende bekende gewichten zijn genormaliseerd. Dit is geen directe lokale meting van voedselopname.`,
  };
}

function summariseResponse(
  entries: ResearchRegistryEntry[],
  evidenceLevel: FeedingEvidenceLevel,
  note: string
): FeedingResponseEvidenceSummary {
  return {
    evidenceLevel: entries.length > 0 ? evidenceLevel : 'none',
    sourceCount: entries.length,
    sourceIds: entries.map((entry) => entry.id).sort(),
    // Evidence registration is not approval. A response is not prediction-eligible
    // until a quantitative, context-matched parameterisation is explicitly validated.
    predictionEligible: false,
    note,
  };
}

/**
 * Builds a separate feeding-evidence assessment for the prognosis output.
 *
 * V0.1 intentionally does not manufacture a numeric feeding score. Direct intake,
 * stomach-fullness proxies, diel rhythm, foraging behaviour and diet remain distinct.
 * The result makes the available evidence and the reason for a missing score explicit.
 */
export function assessSpeciesFeedingActivity(species: FishSpecies, slotResponses: Array<FeedingResponseScore | null> = []): FeedingActivityAssessment {
  if (species === 'Overig') {
    const empty = summariseResponse([], 'none', 'Geen soortspecifieke voedingsrespons beschikbaar voor Overig.');
    return {
      score: null,
      status: 'not_applicable',
      confidencePercent: 0,
      confidenceLevel: 'Laag',
      missingDrivers: [],
      evidenceLevel: 'none',
      responses: {
        intensity: empty,
        incidence: empty,
        rhythm: empty,
        foraging: empty,
        diet: empty,
        preySelection: empty,
      },
      explanation: 'Er is geen specifiek soortprofiel gekozen; daarom wordt geen voedingsscore berekend.',
    };
  }

  const context = getSpeciesFeedingEvidenceContext(species);
  const hasDirectIntensity = context.feedingIntensity.length > 0;
  const hasDirectRhythm = context.feedingRhythm.length > 0;
  const hasDirectEvidence = hasDirectIntensity || hasDirectRhythm;
  const hasProxyEvidence = context.feedingIncidence.length > 0;
  const hasContextEvidence = context.foragingBehavior.length > 0 ||
    context.dietComposition.length > 0 || context.preySelection.length > 0;

  const evidenceLevel: FeedingEvidenceLevel = hasDirectEvidence
    ? 'direct_candidate'
    : hasProxyEvidence
      ? 'proxy_only'
      : hasContextEvidence
        ? 'context_only'
        : 'none';

  const intensity = summariseResponse(
    context.feedingIntensity,
    'direct_candidate',
    context.feedingIntensity.length > 0
      ? 'Directe voedingsintensiteit is onderzocht, maar er is nog geen gevalideerde kwantitatieve soortrespons voor de runtime.'
      : 'Geen directe, soortspecifieke meting van voedselopname-intensiteit geregistreerd.'
  );
  const incidence = summariseResponse(
    context.feedingIncidence,
    'proxy_only',
    context.feedingIncidence.length > 0
      ? 'Voedingsincidentie/maagvulling is een begrensde proxy en wordt niet gelijkgesteld aan voedselopname per tijdseenheid.'
      : 'Geen afzonderlijke voedingsincidentie- of maagvullingsbron geregistreerd.'
  );
  const rhythm = summariseResponse(
    context.feedingRhythm,
    'direct_candidate',
    context.feedingRhythm.length > 0
      ? 'Tijdgebonden voedingsbronnen blijven contextueel; zonder overdraagbare kwantitatieve respons volgt geen tijdvakbonus.'
      : 'Geen directe soortspecifieke voedingsritmebron geregistreerd.'
  );
  const foraging = summariseResponse(
    context.foragingBehavior,
    'context_only',
    context.foragingBehavior.length > 0
      ? 'Foerageergedrag wordt apart gehouden van daadwerkelijk opgenomen voedsel.'
      : 'Geen afzonderlijke foerageergedragsbron geregistreerd.'
  );
  const diet = summariseResponse(
    context.dietComposition,
    'context_only',
    context.dietComposition.length > 0
      ? 'Dieetsamenstelling beschrijft wat gegeten wordt, niet hoeveel of wanneer.'
      : 'Geen afzonderlijke dieetsamenstellingsbron geregistreerd.'
  );
  const preySelection = summariseResponse(
    context.preySelection,
    'context_only',
    context.preySelection.length > 0
      ? 'Prooikeuze blijft ecologische context en is geen maat voor voedingsintensiteit.'
      : 'Geen afzonderlijke prooikeuzebron geregistreerd.'
  );

  const validScores = slotResponses.filter((item): item is FeedingResponseScore => item !== null && Number.isFinite(item.score));
  const score = validScores.length ? Math.round(validScores.reduce((sum, item) => sum + item.score, 0) / validScores.length * 10) / 10 : null;
  const confidencePercent = validScores.length ? Math.round(validScores.reduce((sum, item) => sum + item.confidencePercent, 0) / validScores.length) : 0;
  const missingDrivers = Array.from(new Set(validScores.flatMap((item) => item.missingDrivers)));
  return {
    score,
    status: score === null ? 'insufficient_evidence' : 'provisional',
    evidenceLevel,
    confidencePercent,
    confidenceLevel: confidencePercent >= 75 ? 'Redelijk' : confidencePercent >= 50 ? 'Matig' : 'Laag',
    missingDrivers,
    responses: { intensity, incidence, rhythm, foraging, diet, preySelection },
    explanation: score === null
      ? `Voor ${species} kon de voorlopige dagritme-/seizoensrespons niet worden berekend.`
      : `Operationele voorlopige voedings-/foerageerrespons voor ${species}: ${score.toFixed(1)}/10 (driverdekking ${confidencePercent}%). ${missingDrivers.join('; ')}. De score gebruikt bestaande werkboek-startwaarden; directe voedselopname, maagvulling, foerageergedrag, dieet en prooikeuze blijven afzonderlijk zichtbaar. Dit is geen vangstkans en wordt iteratief verfijnd.`,
  };
}
