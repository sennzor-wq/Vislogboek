import { getSpeciesFeedingEvidenceContext } from './src/services/feedingEvidenceService';
import { ALL_SPECIES } from './src/types';

const expectedScopes: Record<string, string> = {
  Karper: 'direct-feeding',
  Brasem: 'direct-feeding',
  Snoek: 'direct-feeding',
  Baars: 'direct-feeding',
  Voorn: 'direct-feeding',
  Zeelt: 'direct-feeding',
  Snoekbaars: 'direct-feeding',
  Meerval: 'direct-feeding',
  Roofblei: 'diet-only',
  Overig: 'none',
};

for (const species of ALL_SPECIES) {
  const context = getSpeciesFeedingEvidenceContext(species);
  if (context.scope !== expectedScopes[species]) {
    throw new Error(`Unexpected feeding evidence scope for ${species}: ${context.scope}`);
  }
  if (context.approvedFeedingEvidence.length !== 0) {
    throw new Error(`Unapproved literature must not become an approved feeding factor for ${species}.`);
  }
}

const asp = getSpeciesFeedingEvidenceContext('Roofblei');
if (asp.feedingIntensity.length !== 0 || asp.feedingRhythm.length !== 0) {
  throw new Error('Asp diet evidence must not be interpreted as measured daily feeding intensity or rhythm.');
}
if (asp.dietComposition.length === 0 || asp.preySelection.length === 0) {
  throw new Error('Asp diet and prey-selection context must remain available as separate evidence.');
}

const pike = getSpeciesFeedingEvidenceContext('Snoek');
if (pike.feedingIntensity.length === 0 || pike.feedingRhythm.length !== 0) {
  throw new Error('Pike stomach-fullness evidence must not be turned into a diel feeding rhythm.');
}

const tench = getSpeciesFeedingEvidenceContext('Zeelt');
if (tench.feedingIntensity.length === 0 || tench.feedingRhythm.length === 0) {
  throw new Error('Tench field feeding intensity and diel rhythm evidence must both be retained.');
}

console.log('Species feeding evidence context tests passed.');
