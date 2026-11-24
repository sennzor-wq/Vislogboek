import type { FishSpecies, FeedingActivityAssessment, FeedingEvidenceLevel, FeedingResponseEvidenceSummary } from '../types';
import { getSpeciesFeedingEvidenceContext } from './feedingEvidenceService';
import type { ResearchRegistryEntry } from './researchRegistry';

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
export function assessSpeciesFeedingActivity(species: FishSpecies): FeedingActivityAssessment {
  if (species === 'Overig') {
    const empty = summariseResponse([], 'none', 'Geen soortspecifieke voedingsrespons beschikbaar voor Overig.');
    return {
      score: null,
      status: 'not_applicable',
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

  return {
    score: null,
    status: 'insufficient_evidence',
    evidenceLevel,
    responses: { intensity, incidence, rhythm, foraging, diet, preySelection },
    explanation: hasDirectEvidence
      ? `Voor ${species} bestaan directe voedingsstudies, maar de bronnen zijn nog niet omgezet naar een gevalideerde, kwantitatieve responsfunctie die past bij soort, levensfase en context. Daarom blijft de numerieke voedingsscore onbekend.`
      : hasProxyEvidence || hasContextEvidence
        ? `Voor ${species} is voedingsgerelateerde literatuur beschikbaar, maar deze meet vooral proxies of context en ondersteunt nog geen numerieke voedingsintensiteitsscore.`
        : `Voor ${species} is onvoldoende soortspecifiek voedingsbewijs geregistreerd voor een numerieke voedingsscore.`,
  };
}
