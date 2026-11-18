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
if (pike.feedingIntensity.length === 0 || !pike.feedingRhythm.some((item) => item.id === 'pike-juvenile-feeding-rhythm-first-year-1998')) {
  throw new Error('Pike direct feeding evidence must preserve the juvenile-specific diel rhythm without generalising it to adults.');
}

const tench = getSpeciesFeedingEvidenceContext('Zeelt');
if (tench.feedingIntensity.length === 0 || tench.feedingRhythm.length === 0) {
  throw new Error('Tench field feeding intensity and diel rhythm evidence must both be retained.');
}

console.log('Species feeding evidence context tests passed.');


const pikeperch = getSpeciesFeedingEvidenceContext('Snoekbaars');
if (!pikeperch.feedingRhythm.some((item) => item.id === 'pikeperch-lake-ladoga-daily-feeding-rhythm-1982')) {
  throw new Error('Pikeperch seasonal daily feeding rhythm must be available as qualitative literature context.');
}


// The Římov 2004 in-situ study is one source shared by bream and roach,
// not two independent studies or two independent evidence points.
for (const species of ['Brasem', 'Voorn'] as const) {
  const context = getSpeciesFeedingEvidenceContext(species);
  const rimovEntries = context.feedingRhythm.filter(
    (item) => item.id === 'bream-roach-in-situ-diel-zooplankton-feeding-2004' ||
      item.id === 'roach-bream-diel-zooplankton-feeding-2004'
  );
  if (rimovEntries.length !== 1 ||
      rimovEntries[0].id !== 'bream-roach-in-situ-diel-zooplankton-feeding-2004' ||
      !rimovEntries[0].limitations.some((item) => item.includes('juveniele blankvoorn en brasem'))) {
    throw new Error(species + ' must retain one canonical Římov 2004 source with the conflicting juvenile field evidence limitation.');
  }
}
