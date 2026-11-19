import type { FishSpecies } from '../types';
import {
  getResearchByOutcome,
  isApprovedPredictionKnowledge,
  type ResearchRegistryEntry,
} from './researchRegistry';

export type SpeciesThermalEvidenceScope = 'aerobic-scope' | 'metabolic-only' | 'none';

export interface SpeciesThermalEvidenceContext {
  species: FishSpecies;
  aerobicScopeEvidence: ResearchRegistryEntry[];
  metabolicRateEvidence: ResearchRegistryEntry[];
  approvedAerobicScopeEvidence: ResearchRegistryEntry[];
  approvedMetabolicRateEvidence: ResearchRegistryEntry[];
  scope: SpeciesThermalEvidenceScope;
}

/** Bundelt per soort uitsluitend geregistreerde fysiologische temperatuurdata. */
export function getSpeciesThermalEvidenceContext(species: FishSpecies): SpeciesThermalEvidenceContext {
  const forSpecies = (outcome: 'aerobic_scope' | 'metabolic_rate') =>
    species === 'Overig'
      ? []
      : getResearchByOutcome(species, outcome).filter((entry) => entry.species.includes(species));
  const aerobicScopeEvidence = forSpecies('aerobic_scope');
  const metabolicRateEvidence = forSpecies('metabolic_rate');
  return {
    species,
    aerobicScopeEvidence,
    metabolicRateEvidence,
    approvedAerobicScopeEvidence: aerobicScopeEvidence.filter(isApprovedPredictionKnowledge),
    approvedMetabolicRateEvidence: metabolicRateEvidence.filter(isApprovedPredictionKnowledge),
    scope: aerobicScopeEvidence.length > 0 ? 'aerobic-scope' : metabolicRateEvidence.length > 0 ? 'metabolic-only' : 'none',
  };
}

/** Uitsluitend verklarende bronstatus; activeert geen numerieke voorspellingsregel. */
export function getSpeciesThermalEvidenceContextText(species: FishSpecies): string {
  const context = getSpeciesThermalEvidenceContext(species);
  if (context.scope === 'aerobic-scope') {
    const approval = context.approvedAerobicScopeEvidence.length > 0
      ? 'Er is expliciet goedgekeurde aerobe-scopekennis geregistreerd.'
      : 'De geregistreerde aerobe-scopecijfers zijn nog niet goedgekeurd voor numerieke voorspelling.';
    return `Bronstatus: voor ${species} is direct aerobe-scopeonderzoek geregistreerd. De beschikbare studies zijn contextgebonden, onder meer door lichaamsgrootte, levensfase en/of kweekomstandigheden. ${approval} De numerieke profielwaarden zijn uitsluitend onderzoekscontext en worden niet gebruikt in de actieve prognose.`;
  }
  if (context.scope === 'metabolic-only') {
    return `Bronstatus: voor ${species} zijn metabole temperatuurmetingen geregistreerd, maar geen directe aerobe-scopecurve. SMR/RMR is niet hetzelfde als activiteit of voedselopname en onderbouwt op zichzelf geen activiteitoptimum. De numerieke profielwaarden zijn uitsluitend onderzoekscontext en worden niet gebruikt in de actieve prognose.`;
  }
  return `Bronstatus: voor ${species} is in het huidige register geen soortspecifieke meer-temperaturenmeting van aerobe scope of metabolisme opgenomen. De numerieke profielwaarden zijn uitsluitend onderzoekscontext, niet soortspecifiek gevalideerd en niet actief in de prognose.`;
}
