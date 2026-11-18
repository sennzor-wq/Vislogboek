import { ALL_SPECIES } from './src/types';
import { getSpeciesDielBehaviorEvidenceContext, getSpeciesDielTimeContextText } from './src/services/dielBehaviorEvidenceService';

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
    !catfish.locomotorActivity.some((item) => item.id === 'adult-catfish-northern-fringe-seasonal-diel-movement-2024') ||
    catfish.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Catfish controlled feeding rhythm must remain distinct from all adult field telemetry movement sources.');
}
const catfishNorthernMovement = catfish.locomotorActivity.find((item) => item.id === 'adult-catfish-northern-fringe-seasonal-diel-movement-2024');
if (!catfishNorthernMovement ||
    catfish.feedingRhythm.some((item) => item.id === catfishNorthernMovement.id) ||
    catfishNorthernMovement.measuredOutcomes?.includes('feeding_rhythm') ||
    catfish.approvedLocomotorActivity.some((item) => item.id === catfishNorthernMovement.id)) {
  throw new Error('Northern-fringe catfish telemetry must remain unapproved movement/habitat evidence, never a direct feeding rhythm.');
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
  const adultCyprinidFeeding = context.feedingRhythm.find(
    (item) => item.id === 'bream-roach-in-situ-diel-zooplankton-feeding-2004'
  );
  if (!adultCyprinidFeeding || adultCyprinidFeeding.approvedForPrediction ||
      !adultCyprinidFeeding.summary.includes('daggebonden') ||
      !adultCyprinidFeeding.limitations.some((item) => item.includes('lengteklasse'))) {
    throw new Error(species + ' must retain the adult/subadult plankton-feeding evidence and its size/season limitations.');
  }
}
const roachFeeding = roach.feedingRhythm.find(
  (item) => item.id === 'roach-diel-diet-and-habitat-shifts-2002-2004'
);
const roachMovement = roach.locomotorActivity.find(
  (item) => item.id === 'roach-diel-movement-clear-turbid-lakes-2004'
);
if (!roachFeeding || !roachFeeding.measuredOutcomes?.includes('feeding_intensity') ||
    roachFeeding.measuredOutcomes.includes('locomotor_activity') ||
    !roachMovement || !roachMovement.measuredOutcomes?.includes('locomotor_activity') ||
    roachMovement.measuredOutcomes.includes('feeding_rhythm') ||
    roach.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Roach diel feeding intensity and radio-telemetry movement must remain separate evidence responses.');
}


const carpTimeContext = getSpeciesDielTimeContextText('Karper');
if (!carpTimeContext.includes('tijdgebonden voedselopname') ||
    !carpTimeContext.includes('niet goedgekeurd') ||
    !carpTimeContext.includes('score neutraal')) {
  throw new Error('Carp time-slot context must explain unapproved direct feeding-rhythm evidence without creating a preference.');
}

const aspTimeContext = getSpeciesDielTimeContextText('Roofblei');
if (!aspTimeContext.includes('beweging of habitatgebruik') ||
    !aspTimeContext.includes('geen voedingsvoorkeur') ||
    aspTimeContext.includes('voedingsritme geregistreerd')) {
  throw new Error('Asp movement telemetry must never be presented as a feeding-time preference.');
}

const genericTimeContext = getSpeciesDielTimeContextText('Overig');
if (!genericTimeContext.includes('geen soortspecifiek tijdgebonden voedingsritme') ||
    genericTimeContext.includes('voorkeursperiode')) {
  throw new Error('The generic profile must not inherit a species-specific time preference.');
}

const carpDiel = getSpeciesDielBehaviorEvidenceContext('Karper');
if (!carpDiel.feedingRhythm.some((item) => item.id === 'common-carp-wild-night-feeding-lake-2010') ||
    !carpDiel.feedingRhythm.some((item) => item.id === 'common-carp-wild-bait-station-feeding-2022') ||
    carpDiel.feedingRhythm.some((item) => item.id === 'common-carp-angling-competition-night-landings-2021') ||
    carpDiel.temporalEvidenceScope !== 'feeding-and-movement') {
  throw new Error('Wild carp feeding evidence must be exposed separately from angling landings and movement evidence.');
}


if (!carpDiel.feedingRhythm.some((item) => item.id === 'common-carp-adult-bait-site-night-feeding-2018') ||
    !carpDiel.habitatUse.some((item) => item.id === 'common-carp-bait-encounter-angling-vulnerability-2017') ||
    carpDiel.feedingRhythm.some((item) => item.id === 'common-carp-bait-encounter-angling-vulnerability-2017')) {
  throw new Error('Carp bait-site feeding rhythm and encounter/vulnerability evidence must remain separate.');
}
