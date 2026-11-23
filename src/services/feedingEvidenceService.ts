import type { FishSpecies } from '../types';
import {
  getResearchByOutcome,
  isApprovedPredictionKnowledge,
  type ResearchOutcome,
  type ResearchRegistryEntry,
} from './researchRegistry';

export type FeedingEvidenceScope =
  | 'direct-feeding'
  | 'feeding-incidence-and-diet'
  | 'feeding-incidence-only'
  | 'foraging-only'
  | 'diet-only'
  | 'none';

export interface SpeciesFeedingEvidenceContext {
  species: FishSpecies;
  feedingIntensity: ResearchRegistryEntry[];
  /** Maagvulling/vacuïteitsproxy; niet gelijk aan voedselhoeveelheid of voedingssnelheid. */
  feedingIncidence: ResearchRegistryEntry[];
  feedingRhythm: ResearchRegistryEntry[];
  foragingBehavior: ResearchRegistryEntry[];
  dietComposition: ResearchRegistryEntry[];
  preySelection: ResearchRegistryEntry[];
  scope: FeedingEvidenceScope;
  /** Alleen expliciet goedgekeurde directe voedingsbronnen; nooit automatisch afgeleid uit bewijssterkte. */
  approvedFeedingEvidence: ResearchRegistryEntry[];
}

function byOutcome(species: FishSpecies, outcome: ResearchOutcome): ResearchRegistryEntry[] {
  return getResearchByOutcome(species, outcome);
}

/**
 * Bundelt per soort de responsvariabelen die de literatuur daadwerkelijk meet.
 * Dit is uitsluitend onderzoekscontext: de functie berekent geen voedingskans,
 * tijdvakscore of activiteit en wijzigt geen bestaande prognose-uitkomst.
 */
export function getSpeciesFeedingEvidenceContext(
  species: FishSpecies
): SpeciesFeedingEvidenceContext {
  const feedingIntensity = byOutcome(species, 'feeding_intensity');
  const feedingIncidence = byOutcome(species, 'feeding_incidence');
  const feedingRhythm = byOutcome(species, 'feeding_rhythm');
  const foragingBehavior = byOutcome(species, 'foraging_behavior');
  const dietComposition = byOutcome(species, 'diet_composition');
  const preySelection = byOutcome(species, 'prey_selection');

  const hasDirectFeeding = feedingIntensity.length > 0 || feedingRhythm.length > 0;
  const hasFeedingIncidence = feedingIncidence.length > 0;
  const hasForaging = foragingBehavior.length > 0;
  const hasDiet = dietComposition.length > 0 || preySelection.length > 0;

  const scope: FeedingEvidenceScope = hasDirectFeeding
    ? 'direct-feeding'
    : hasFeedingIncidence
      ? hasDiet ? 'feeding-incidence-and-diet' : 'feeding-incidence-only'
      : hasForaging
        ? 'foraging-only'
        : hasDiet
          ? 'diet-only'
          : 'none';

  const feedingEvidence = [
    ...feedingIntensity,
    ...feedingRhythm,
    ...foragingBehavior,
  ];
  const approvedFeedingEvidence = Array.from(
    new Map(
      feedingEvidence
        .filter(isApprovedPredictionKnowledge)
        .map((entry) => [entry.id, entry] as const)
    ).values()
  );

  return {
    species,
    feedingIntensity,
    feedingIncidence,
    feedingRhythm,
    foragingBehavior,
    dietComposition,
    preySelection,
    scope,
    approvedFeedingEvidence,
  };
}
