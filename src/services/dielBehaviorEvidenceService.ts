import type { FishSpecies } from '../types';
import {
  getResearchByOutcome,
  isApprovedPredictionKnowledge,
} from './researchRegistry';
import type { ResearchRegistryEntry } from './researchRegistry';

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


/**
 * Neutrale uitleg voor de tijdvakfactor. Oude profielvoorkeuren zijn geen
 * voorspellingsbewijs; alleen de gemeten respons in het researchregister
 * bepaalt welke biologische context veilig kan worden getoond.
 */
export function getSpeciesDielTimeContextText(species: FishSpecies): string {
  const context = getSpeciesDielBehaviorEvidenceContext(species);

  if (context.feedingRhythm.length > 0) {
    const approvalNote = context.approvedFeedingRhythm.length > 0
      ? 'Er is ten minste één bron voor deze voedingsrespons goedgekeurd, maar een tijdvakverschil wordt alleen toegepast als de bron ook qua seizoen, levensfase en habitat past.'
      : 'Deze bronnen zijn nog niet goedgekeurd als numerieke voorspellingsfactor.';
    return `Voor ${species} zijn studies met tijdgebonden voedselopname of voedingsritme geregistreerd. De uitkomsten zijn contextgebonden en bewijzen geen universele voorkeur voor dit tijdvak. ${approvalNote} Daarom blijft de tijdvakscore neutraal.`;
  }

  if (context.locomotorActivity.length > 0 || context.habitatUse.length > 0) {
    return `Voor ${species} beschrijven de beschikbare dagritmestudies vooral beweging of habitatgebruik, niet rechtstreeks tijdgebonden voedselopname. Daaruit leid ik geen voedingsvoorkeur of tijdvakbonus af; de tijdvakscore blijft neutraal.`;
  }

  return `In het huidige bronnenregister is voor ${species} geen soortspecifiek tijdgebonden voedingsritme vastgesteld. Dat betekent niet dat een tijdvak slechter is; er wordt geen tijdvakvoorkeur afgeleid en de score blijft neutraal.`;
}