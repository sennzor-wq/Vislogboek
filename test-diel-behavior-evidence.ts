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

const perch = getSpeciesDielBehaviorEvidenceContext('Baars');
if (!perch.feedingRhythm.some((item) => item.id === 'perch-lake-ladoga-diel-feeding-1982')) {
  throw new Error('Perch must expose the Lake Ladoga field feeding study as direct feeding evidence, without assuming a fixed daily peak.');
}

const asp = getSpeciesDielBehaviorEvidenceContext('Roofblei');
if (asp.feedingRhythm.length !== 0 || asp.locomotorActivity.length === 0 || asp.temporalEvidenceScope !== 'movement-only') {
  throw new Error('Asp telemetry must remain movement-only, with no invented direct feeding rhythm.');
}

const catfish = getSpeciesDielBehaviorEvidenceContext('Meerval');
if (!catfish.feedingRhythm.some((item) => item.id === 'european-catfish-diel-feeding-self-feeder-1995') ||
    !catfish.locomotorActivity.some((item) => item.id === 'european-catfish-feeding-and-activity-rhythms-1995-2012') ||
    !catfish.locomotorActivity.some((item) => item.id === 'adult-catfish-diel-activity-reservoir-2025') ||
    catfish.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Catfish controlled feeding rhythm must remain distinct from both adult field telemetry movement sources.');
}

const generic = getSpeciesDielBehaviorEvidenceContext('Overig');
if (generic.hasSpeciesSpecificTimeEvidence || generic.temporalEvidenceScope !== 'none' ||
    generic.feedingRhythm.length + generic.locomotorActivity.length + generic.habitatUse.length !== 0) {
  throw new Error('The generic fallback must not inherit species-specific diel evidence.');
}

console.log('Species diel behaviour evidence service tests passed.');

const bream = getSpeciesDielBehaviorEvidenceContext('Brasem');
const roach = getSpeciesDielBehaviorEvidenceContext('Voorn');
for (const [species, context] of [['Brasem', bream], ['Voorn', roach]] as const) {
  const juvenileNightEvidence = context.feedingRhythm.find(
    (item) => item.id === 'juvenile-cyprinid-night-feeding-bavarian-lakes-1979'
  );
  if (!juvenileNightEvidence || juvenileNightEvidence.approvedForPrediction ||
      !juvenileNightEvidence.limitations.some((item) => item.includes('juveniele'))) {
    throw new Error(species + ' must expose Bohl juvenile night-feeding evidence with its life-stage limitation.');
  }
}
