import { RESEARCH_REGISTRY, getResearchByTopic, getResearchBySpecies, getResearchByOutcome, isApprovedPredictionKnowledge, ResearchOutcome } from './src/services/researchRegistry';
import { SPECIES_PROFILES } from './src/services/fishProfiles';

const thermalEntries = getResearchByTopic('watertemperatuur');
if (thermalEntries.length !== 3) throw new Error('Expected the three reviewed water-temperature evidence entries.');
const entry = thermalEntries[0];
if (!entry.sourceReferences.some((source) => source.includes('10.1029/2023RG000816'))) {
  throw new Error('The lake thermal modelling review DOI must be retained.');
}
if (entry.approvedForPrediction || isApprovedPredictionKnowledge(entry)) {
  throw new Error('A general lake thermal review must not silently approve a direct prediction rule.');
}
if (entry.limitations.length < 3) {
  throw new Error('The thermal evidence entry must retain its applicability limitations.');
}
if (!RESEARCH_REGISTRY.includes(entry)) {
  throw new Error('The reviewed entry must be present in the central registry.');
}
console.log('Research registry tests passed.');

const carpEvidence = getResearchBySpecies('Karper');
if (!carpEvidence.some((item) => item.id === 'common-carp-temperature-feeding-rhythm-2012')) {
  throw new Error('Carp-specific feeding-rhythm evidence must be discoverable by species.');
}
const breamEvidence = getResearchBySpecies('Brasem');
const growthStudy = breamEvidence.find((item) => item.id === 'freshwater-fish-temperature-growth-four-species-tien-2024');
if (!growthStudy || growthStudy.approvedForPrediction) {
  throw new Error('The Dutch lake growth study must be available as non-approved biological evidence.');
}
if (!growthStudy.limitations.some((item) => item.includes('acute activiteit'))) {
  throw new Error('Growth evidence must explicitly be distinguished from acute activity.');
}
const tenchEvidence = getResearchBySpecies('Zeelt');
if (!tenchEvidence.some((item) => item.id === 'tench-temperature-feeding-efficiency-2026' && !item.approvedForPrediction)) {
  throw new Error('Tench feeding evidence must remain contextual and non-approved for prediction.');
}
console.log('Species biology evidence tests passed.');

if (!SPECIES_PROFILES.Karper.scientificReferences.some((source) => source.includes('10.1016/S1006-8104(12)60039-7'))) {
  throw new Error('The carp profile must link its species-specific feeding-rhythm study.');
}
if (!SPECIES_PROFILES.Brasem.scientificReferences.some((source) => source.includes('10.1111/jfb.15745'))) {
  throw new Error('The bream profile must link the Dutch lake growth study with its scope limitation.');
}
if (!SPECIES_PROFILES.Zeelt.scientificReferences.some((source) => source.includes('10.1007/s10530-026-03767-w'))) {
  throw new Error('The tench profile must link the limited experimental feeding study.');
}
console.log('Species profile source-link tests passed.');


const coveredSpecies = ['Karper', 'Brasem', 'Snoek', 'Baars', 'Voorn', 'Zeelt', 'Snoekbaars', 'Meerval', 'Roofblei'];
for (const species of coveredSpecies) {
  const entries = RESEARCH_REGISTRY.filter((item) => item.species.includes(species));
  if (entries.length === 0) {
    throw new Error(`The central research registry must contain species-linked evidence for ${species}.`);
  }
  if (entries.some((item) => item.approvedForPrediction)) {
    throw new Error(`Evidence for ${species} must not silently activate a prediction rule.`);
  }
}
if (RESEARCH_REGISTRY.some((item) => item.species.includes('Overig'))) {
  throw new Error('The generic Overig fallback must not be presented as a biological species.');
}
const sharedPikeEvidence = getResearchBySpecies('Snoekbaars').find((item) => item.id === 'northern-pike-lowland-river-movement-habitat-2025');
if (!sharedPikeEvidence || !sharedPikeEvidence.species.includes('Snoek')) {
  throw new Error('The lowland-river telemetry study must be linked to both pike and pikeperch.');
}
console.log('All concrete species have registered, non-approved biological evidence.');
const directFeedingEvidenceBySpecies: Record<string, string> = {
  Karper: 'common-carp-diel-grazing-food-type-2009',
  Brasem: 'bream-roach-in-situ-diel-zooplankton-feeding-2004',
  Snoek: 'northern-pike-field-seasonal-feeding-diet-2025',
  Baars: 'perch-field-diel-feeding-seasonal-diet-1986',
  Voorn: 'roach-autumnal-diel-feeding-shift-2008',
  Zeelt: 'tench-field-diel-seasonal-feeding-2018',
  Snoekbaars: 'pikeperch-winter-spring-feeding-temperature-2020',
  Meerval: 'wels-catfish-seasonal-diet-feeding-2025',
  Roofblei: 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018',
};
for (const [species, id] of Object.entries(directFeedingEvidenceBySpecies)) {
  const evidence = RESEARCH_REGISTRY.find((item) => item.id === id);
  if (!evidence || !evidence.species.includes(species)) {
    throw new Error(`Direct feeding/diet evidence must be linked to ${species}.`);
  }
  if (evidence.approvedForPrediction || evidence.sourceReferences.length === 0 || evidence.limitations.length === 0) {
    throw new Error(`Feeding evidence for ${species} must retain source limitations and remain non-approved.`);
  }
}
const pikeFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-field-seasonal-feeding-diet-2025');
if (!pikeFeeding?.summary.includes('niet statistisch significant')) {
  throw new Error('The pike evidence must preserve the non-significant seasonal/temperature result.');
}
const catfishFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'wels-catfish-seasonal-diet-feeding-2025');
if (!catfishFeeding?.sourceReferences.some((source) => source.includes('Aquaculture Nutrition'))) {
  throw new Error('The catfish feeding study must retain its verified journal metadata.');
}
console.log('Direct feeding evidence coverage and non-activation tests passed.');
const profileFeedingSourceChecks: Record<string, string> = {
  Karper: '10.1111/j.1095-8649.2009.02236.x',
  Brasem: 'In situ diel patterns of zooplankton consumption',
  Snoek: '10.3409/fb_73-3.10',
  Baars: 'annzool.net/PDF/anzf23/anz23-049-056.pdf',
  Voorn: '10.1111/j.1095-8649.2008.02020.x',
  Zeelt: '10.1134/S003294521804001X',
  Snoekbaars: '10.1111/are.14401',
  Meerval: '10.1155/anu/4619857',
  Roofblei: '10.1111/eff.12414',
};
for (const [species, reference] of Object.entries(profileFeedingSourceChecks)) {
  if (!SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES].scientificReferences.some((source) => source.includes(reference))) {
    throw new Error(`The ${species} profile must link its reviewed feeding/diet evidence.`);
  }
}
console.log('All species profiles link their feeding evidence sources.');



// Measured outcomes are explicit study classifications, not inferred from topic wording.
const outcomeExpectations: Array<[string, string, string]> = [
  ['Karper', 'common-carp-temperature-feeding-rhythm-2012', 'feeding_intensity'],
  ['Brasem', 'bream-roach-in-situ-diel-zooplankton-feeding-2004', 'feeding_intensity'],
  ['Snoek', 'northern-pike-field-seasonal-feeding-diet-2025', 'diet_composition'],
  ['Baars', 'perch-field-diel-feeding-seasonal-diet-1986', 'feeding_rhythm'],
  ['Voorn', 'roach-autumnal-diel-feeding-shift-2008', 'feeding_rhythm'],
  ['Zeelt', 'tench-field-diel-seasonal-feeding-2018', 'feeding_intensity'],
  ['Snoekbaars', 'pikeperch-winter-spring-feeding-temperature-2020', 'feeding_physiology'],
  ['Meerval', 'wels-catfish-seasonal-diet-feeding-2025', 'diet_composition'],
  ['Roofblei', 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018', 'prey_selection'],
];
for (const [species, id, outcome] of outcomeExpectations) {
  const matches = getResearchByOutcome(species, outcome as ResearchOutcome);
  if (!matches.some((item) => item.id === id)) {
    throw new Error(`The measured outcome ${outcome} must be explicitly discoverable for ${species}.`);
  }
  if (matches.some((item) => item.approvedForPrediction)) {
    throw new Error(`Outcome classification must not approve prediction factors for ${species}.`);
  }
}
const aspFeedingIntensity = getResearchByOutcome('Roofblei', 'feeding_intensity');
if (aspFeedingIntensity.length !== 0) {
  throw new Error('Asp diet/prey-selection evidence must not be misclassified as measured feeding intensity.');
}
const aspDiet = getResearchByOutcome('Roofblei', 'diet_composition');
if (!aspDiet.some((item) => item.id === 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018')) {
  throw new Error('Asp ontogenetic diet evidence must remain discoverable as diet composition.');
}
const growthOnly = getResearchByOutcome('Brasem', 'growth');
if (!growthOnly.some((item) => item.id === 'freshwater-fish-temperature-growth-four-species-tien-2024')) {
  throw new Error('Growth evidence must remain separately classified from feeding intensity.');
}
console.log('Measured biological outcome classification tests passed.');


const metabolicEvidenceExpectations: Array<[string, string]> = [
  ['Karper', 'common-carp-acute-temperature-metabolism-1983'],
  ['Snoek', 'northern-pike-metabolic-rate-temperature-1982'],
  ['Baars', 'european-perch-aerobic-scope-size-temperature-2020'],
  ['Brasem', 'roach-bream-metabolic-rate-temperature-2006'],
  ['Voorn', 'roach-bream-metabolic-rate-temperature-2006'],
  ['Snoekbaars', 'adult-pikeperch-aerobic-scope-temperature-2012'],
];
for (const [species, id] of metabolicEvidenceExpectations) {
  const entry = getResearchByOutcome(species, 'metabolic_rate').find((item) => item.id === id);
  if (!entry || entry.approvedForPrediction || entry.limitations.length === 0 || entry.sourceReferences.length === 0) {
    throw new Error(`Thermal metabolic evidence for ${species} must be discoverable, limited and non-approved.`);
  }
}
for (const species of ['Baars', 'Snoekbaars']) {
  if (!getResearchByOutcome(species, 'aerobic_scope').some((item) => !item.approvedForPrediction)) {
    throw new Error(`Aerobic-scope evidence must remain separate and non-approved for ${species}.`);
  }
}
if (getResearchByOutcome('Baars', 'feeding_intensity').some((item) => item.id === 'european-perch-aerobic-scope-size-temperature-2020')) {
  throw new Error('Aerobic-scope evidence must not be misclassified as feeding intensity.');
}
if (getResearchByOutcome('Snoekbaars', 'feeding_intensity').some((item) => item.id === 'adult-pikeperch-aerobic-scope-temperature-2012')) {
  throw new Error('Metabolic-scope evidence must not be misclassified as feeding intensity.');
}
console.log('Thermal physiology evidence classification tests passed.');


const thermalProfileSourceChecks: Record<string, string[]> = {
  Karper: ['10.1086/physzool.56.3.30152604'],
  Snoek: ['10.1016/0300-9629(82)90424-8'],
  Baars: ['10.1111/jfb.14435'],
  Brasem: ['10.1163/157075606775904713'],
  Voorn: ['10.1046/j.1095-8649.2003.00048.x', '10.1163/157075606775904713'],
  Snoekbaars: ['10.1016/j.aquaculture.2011.10.024'],
};
for (const [species, references] of Object.entries(thermalProfileSourceChecks)) {
  const profile = SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES];
  for (const reference of references) {
    if (!profile.scientificReferences.some((source) => source.includes(reference))) {
      throw new Error(`The ${species} profile must link thermal physiology source ${reference}.`);
    }
  }
}
console.log('Species thermal physiology profile source links passed.');
