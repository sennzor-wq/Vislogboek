import { ALL_SPECIES } from './src/types';
import { getSpeciesDielBehaviorEvidenceContext } from './src/services/dielBehaviorEvidenceService';

for (const species of ALL_SPECIES) {
  const context = getSpeciesDielBehaviorEvidenceContext(species);
  if (context.species !== species) {
    throw new Error(`Diel evidence context must retain the requested species: ${species}.`);
  }
  if ([...context.approvedFeedingRhythm, ...context.approvedLocomotorActivity, ...context.approvedHabitatUse].length !== 0) {
    throw new Error(`No unapproved diel literature may silently become an approved prediction factor for ${species}.`);
  }
  for (const entry of [...context.feedingRhythm, ...context.locomotorActivity, ...context.habitatUse]) {
    if (!entry.species.includes(species)) {
      throw new Error(`Diel evidence for ${species} must be explicitly species-linked.`);
    }
  }
}

const pike = getSpeciesDielBehaviorEvidenceContext('Snoek');
if (!pike.feedingRhythm.some((item) => item.id === 'pike-juvenile-feeding-rhythm-first-year-1998') ||
    !pike.locomotorActivity.some((item) => item.id === 'pike-dusk-habitat-change-visibility-2012') ||
    pike.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Pike must expose direct juvenile feeding rhythm separately from movement/habitat evidence.');
}

const pikeperch = getSpeciesDielBehaviorEvidenceContext('Snoekbaars');
if (!pikeperch.feedingRhythm.some((item) => item.id === 'pikeperch-lake-ladoga-daily-feeding-rhythm-1982') ||
    !pikeperch.locomotorActivity.some((item) => item.id === 'pikeperch-diel-activity-dusk-drainage-canal-2005') ||
    pikeperch.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Pikeperch must expose its seasonal feeding rhythm separately from telemetry movement.');
}

const asp = getSpeciesDielBehaviorEvidenceContext('Roofblei');
if (asp.feedingRhythm.length !== 0 || asp.locomotorActivity.length === 0 || asp.temporalEvidenceScope !== 'movement-only') {
  throw new Error('Asp telemetry must remain movement-only, with no invented direct feeding rhythm.');
}

const catfish = getSpeciesDielBehaviorEvidenceContext('Meerval');
if (!catfish.locomotorActivity.some((item) => item.id === 'adult-catfish-diel-activity-belver-reservoir-2025') ||
    catfish.feedingRhythm.some((item) => item.id === 'adult-catfish-diel-activity-belver-reservoir-2025') ||
    catfish.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Adult catfish telemetry must enrich movement evidence only and must not be reclassified as direct feeding rhythm.');
}

const generic = getSpeciesDielBehaviorEvidenceContext('Overig');
if (generic.hasSpeciesSpecificTimeEvidence || generic.temporalEvidenceScope !== 'none' ||
    generic.feedingRhythm.length + generic.locomotorActivity.length + generic.habitatUse.length !== 0) {
  throw new Error('The generic fallback must not inherit species-specific diel evidence.');
}

console.log('Species diel behaviour evidence service tests passed.');
