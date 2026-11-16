import { FishSpecies } from '../types';
import {
  getResearchByOutcome,
  isApprovedPredictionKnowledge,
  ResearchRegistryEntry,
} from './researchRegistry';

/**
 * Tijdgebonden bewijs wordt strikt naar de werkelijk gemeten respons gescheiden.
 * Bewegings-/habitatbewijs is geen bewijs voor voedselopname of vangstkans.
 */
export interface SpeciesDielBehaviorEvidenceContext {
  species: FishSpecies;
  feedingRhythm: ResearchRegistryEntry[];
  locomotorActivity: ResearchRegistryEntry[];
  habitatUse: ResearchRegistryEntry[];
  approvedFeedingRhythm: ResearchRegistryEntry[];
  approvedLocomotorActivity: ResearchRegistryEntry[];
  approvedHabitatUse: ResearchRegistryEntry[];
  temporalEvidenceScope: 'feeding-and-movement' | 'feeding-only' | 'movement-only' | 'none';
  hasSpeciesSpecificTimeEvidence: boolean;
}

/**
 * Geeft de tijdgebonden literatuurcontext voor één soort terug.
 * Alleen expliciet aan die soort gekoppelde registraties worden meegenomen;
 * generieke bronnen en het fallbackprofiel leveren geen verzonnen dagritme.
 * De functie berekent geen score en keurt geen bron automatisch goed.
 */
export function getSpeciesDielBehaviorEvidenceContext(
  species: FishSpecies
): SpeciesDielBehaviorEvidenceContext {
  if (species === 'Overig') {
    return {
      species,
      feedingRhythm: [],
      locomotorActivity: [],
      habitatUse: [],
      approvedFeedingRhythm: [],
      approvedLocomotorActivity: [],
      approvedHabitatUse: [],
      temporalEvidenceScope: 'none',
      hasSpeciesSpecificTimeEvidence: false,
    };
  }

  const forSpecies = (outcome: 'feeding_rhythm' | 'locomotor_activity' | 'habitat_use') =>
    getResearchByOutcome(species, outcome).filter((entry) => entry.species.includes(species));

  const feedingRhythm = forSpecies('feeding_rhythm');
  const locomotorActivity = forSpecies('locomotor_activity');
  const habitatUse = forSpecies('habitat_use');
  const hasMovementEvidence = locomotorActivity.length > 0 || habitatUse.length > 0;

  return {
    species,
    feedingRhythm,
    locomotorActivity,
    habitatUse,
    approvedFeedingRhythm: feedingRhythm.filter(isApprovedPredictionKnowledge),
    approvedLocomotorActivity: locomotorActivity.filter(isApprovedPredictionKnowledge),
    approvedHabitatUse: habitatUse.filter(isApprovedPredictionKnowledge),
    temporalEvidenceScope: feedingRhythm.length > 0
      ? hasMovementEvidence ? 'feeding-and-movement' : 'feeding-only'
      : hasMovementEvidence ? 'movement-only' : 'none',
    hasSpeciesSpecificTimeEvidence: feedingRhythm.length > 0 || hasMovementEvidence,
  };
}
