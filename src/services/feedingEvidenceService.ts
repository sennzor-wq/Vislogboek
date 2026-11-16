import type { FishSpecies } from '../types';
import {
  getResearchByOutcome,
  isApprovedPredictionKnowledge,
  type ResearchOutcome,
  type ResearchRegistryEntry,
} from './researchRegistry';

export type FeedingEvidenceScope =
  | 'direct-feeding'
  | 'foraging-only'
  | 'diet-only'
  | 'none';

export interface SpeciesFeedingEvidenceContext {
  species: FishSpecies;
  feedingIntensity: ResearchRegistryEntry[];
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
  const feedingRhythm = byOutcome(species, 'feeding_rhythm');
  const foragingBehavior = byOutcome(species, 'foraging_behavior');
  const dietComposition = byOutcome(species, 'diet_composition');
  const preySelection = byOutcome(species, 'prey_selection');

  const hasDirectFeeding = feedingIntensity.length > 0 || feedingRhythm.length > 0;
  const hasForaging = foragingBehavior.length > 0;
  const hasDiet = dietComposition.length > 0 || preySelection.length > 0;

  const scope: FeedingEvidenceScope = hasDirectFeeding
    ? 'direct-feeding'
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
        .map((entry) => [entry.id, entry])
    ).values()
  );

  return {
    species,
    feedingIntensity,
    feedingRhythm,
    foragingBehavior,
    dietComposition,
    preySelection,
    scope,
    approvedFeedingEvidence,
  };
}
